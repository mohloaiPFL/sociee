const express = require("express");
const mongoose = require("mongoose");
const Content = require("../models/content");
const Comment = require("../models/comment");
const Like = require("../models/like");
const authenticate = require("../middleware/authenticate");
const { asyncHandler, isValidObjectId } = require("../utils/http");
const publishScheduledContent = require("../utils/publishScheduled");

const router = express.Router();
const contentTypes = new Map([
    ["video", "Video"],
    ["article", "Article"],
    ["podcast", "Podcast"],
    ["image", "Image"]
]);
const statuses = new Set(["Draft", "Published", "Scheduled"]);

function inputError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function serializeContent(content) {
    const item = content.toObject ? content.toObject() : content;
    const publicItem = { ...item };
    const owner = item.ownerId && typeof item.ownerId.displayName === "string"
        ? item.ownerId
        : null;
    delete publicItem.ownerId;
    return {
        ...publicItem,
        creator: {
            id: owner?._id?.toString() || "",
            name: owner?.displayName || "Sociee Creator",
            bio: owner?.bio || "",
            profileImage: owner?.profileImage || ""
        },
        contentType: item.type ? item.type.toLowerCase() : "video",
        thumbnail: item.thumbnailUrl || "",
        mediaUrls: item.mediaUrls || [],
        publicationDate: item.status === "Scheduled"
            ? item.scheduledAt
            : item.publishedAt || item.scheduledAt || null,
        views: item.viewCount || 0
    };
}

function validateUrl(value, field) {
    if (!value) return "";
    if (typeof value !== "string" || value.length > 2048) {
        throw inputError(`${field} must be a URL shorter than 2048 characters.`);
    }
    let parsed;
    try {
        parsed = new URL(value);
    } catch {
        throw inputError(`${field} must be a valid HTTP or HTTPS URL.`);
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
        throw inputError(`${field} must be a valid HTTP or HTTPS URL.`);
    }
    return value.trim();
}

function normalizeContentInput(body, partial = false) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw inputError("A content object is required.");
    }

    const result = {};
    const assignString = (key, value, maxLength, required = false) => {
        if (value === undefined && partial) return;
        if (typeof value !== "string" || (required && !value.trim())) {
            throw inputError(`${key} is required and must be text.`);
        }
        const normalized = value.trim();
        if (normalized.length > maxLength) throw inputError(`${key} is too long.`);
        result[key] = normalized;
    };

    assignString("title", body.title, 200, true);
    assignString("description", body.description, 10000, true);
    assignString("category", body.category, 80, true);

    const rawType = body.contentType ?? body.type;
    if (rawType !== undefined || !partial) {
        const normalizedType = typeof rawType === "string" && contentTypes.get(rawType.toLowerCase());
        if (!normalizedType) throw inputError("Content type must be video, article, podcast, or image.");
        result.type = normalizedType;
    }

    const thumbnail = body.thumbnail ?? body.thumbnailUrl;
    if (thumbnail !== undefined || !partial) {
        result.thumbnailUrl = validateUrl(thumbnail || "", "Thumbnail");
    }
    if (body.mediaUrl !== undefined || !partial) {
        result.mediaUrl = validateUrl(body.mediaUrl || "", "Media URL");
    }
    if (body.mediaUrls !== undefined || !partial) {
        if (!Array.isArray(body.mediaUrls) || body.mediaUrls.length > 10) {
            throw inputError("Choose no more than 10 media files.");
        }
        result.mediaUrls = body.mediaUrls.map(url => validateUrl(url, "Media URL"));
        if (result.mediaUrls.length > 0) result.mediaUrl = result.mediaUrls[0];
    }
    if (body.articleContent !== undefined || !partial) {
        if (typeof (body.articleContent || "") !== "string" || (body.articleContent || "").length > 100000) {
            throw inputError("Article content must be text shorter than 100000 characters.");
        }
        result.articleContent = body.articleContent || "";
    }

    if (body.status !== undefined || !partial) {
        const status = body.status || "Draft";
        if (!statuses.has(status)) throw inputError("Status must be Draft, Published, or Scheduled.");
        result.status = status;
    }

    const publicationDate = body.publicationDate ?? body.scheduledAt ?? body.publishedAt;
    if (publicationDate !== undefined || !partial) {
        if (publicationDate === "" || publicationDate === null) {
            result.scheduledAt = null;
            result.publishedAt = null;
        } else {
            const date = new Date(publicationDate);
            if (Number.isNaN(date.getTime())) throw inputError("Publication date is invalid.");
            const status = result.status || body.status;
            if (status === "Scheduled" && date <= new Date()) {
                throw inputError("Scheduled content must have a future publication date.");
            }
            if (status === "Published" && date > new Date()) {
                throw inputError("Choose Scheduled for a future publication date.");
            }
            result.scheduledAt = status === "Scheduled" ? date : null;
            result.publishedAt = status === "Published" ? date : null;
        }
    }

    return result;
}

const managementListAuth = (req, res, next) => {
    if (req.query.all === "true") return authenticate(req, res, next);
    return next();
};

router.get("/", managementListAuth, asyncHandler(async (req, res) => {
    let contents;
    if (req.query.all === "true") {
        contents = await Content.find({ ownerId: req.userId })
            .populate("ownerId", "displayName bio profileImage")
            .sort({ createdAt: -1 });
    } else {
        await publishScheduledContent();
        contents = await Content.find({ status: "Published" })
            .populate("ownerId", "displayName bio profileImage")
            .sort({ publishedAt: -1, createdAt: -1 });
    }
    const ids = contents.map(item => item._id);
    const likeCounts = await Like.aggregate([
        { $match: { contentId: { $in: ids } } },
        { $group: { _id: "$contentId", count: { $sum: 1 } } }
    ]);
    const countsById = new Map(likeCounts.map(item => [item._id.toString(), item.count]));
    res.json(contents.map(item => ({
        ...serializeContent(item),
        likesCount: countsById.get(item._id.toString()) || item.likesCount || 0
    })));
}));

router.post("/", authenticate, asyncHandler(async (req, res) => {
    const content = await Content.create({
        ...normalizeContentInput(req.body),
        ownerId: req.userId
    });
    await content.populate("ownerId", "displayName bio profileImage");
    res.status(201).json({ message: "Content created successfully.", content: serializeContent(content) });
}));

router.get("/:id", asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid content ID." });
    await publishScheduledContent();
    const content = await Content.findOne({ _id: req.params.id, status: "Published" })
        .populate("ownerId", "displayName bio profileImage");
    if (!content) return res.status(404).json({ message: "Published content not found." });
    return res.json(serializeContent(content));
}));

router.post("/:id/view", asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid content ID." });
    const content = await Content.findOneAndUpdate(
        { _id: req.params.id, status: "Published" },
        { $inc: { viewCount: 1 } },
        { new: true }
    );
    if (!content) return res.status(404).json({ message: "Published content not found." });
    return res.json({ views: content.viewCount });
}));

router.put("/:id", authenticate, asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid content ID." });
    const updates = normalizeContentInput(req.body, true);
    const content = await Content.findOneAndUpdate(
        { _id: req.params.id, ownerId: req.userId },
        updates,
        {
            new: true,
            runValidators: true
        }
    ).populate("ownerId", "displayName bio profileImage");
    if (!content) return res.status(404).json({ message: "Content not found." });
    return res.json({ message: "Content updated successfully.", content: serializeContent(content) });
}));

router.delete("/:id", authenticate, asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid content ID." });
    const contentId = new mongoose.Types.ObjectId(req.params.id);
    const content = await Content.findOneAndDelete({ _id: contentId, ownerId: req.userId });
    if (!content) return res.status(404).json({ message: "Content not found." });
    await Promise.all([
        Comment.deleteMany({ contentId }),
        Like.deleteMany({ contentId })
    ]);
    return res.json({ message: "Content deleted successfully." });
}));

module.exports = router;
