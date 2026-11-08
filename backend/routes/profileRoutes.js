const express = require("express");
const User = require("../models/user");
const Media = require("../models/media");
const Content = require("../models/content");
const Comment = require("../models/comment");
const Like = require("../models/like");
const authenticate = require("../middleware/authenticate");
const { asyncHandler, isValidObjectId } = require("../utils/http");

const router = express.Router();

router.get("/me", authenticate, asyncHandler(async (req, res) => {
    const creator = await User.findById(req.userId).select("displayName bio profileImage");
    if (!creator) return res.status(404).json({ message: "Creator account not found." });

    return res.json({
        id: creator._id.toString(),
        name: creator.displayName,
        bio: creator.bio,
        profileImage: creator.profileImage
    });
}));

router.put("/me", authenticate, asyncHandler(async (req, res) => {
    const { displayName, bio, profileImage } = req.body || {};
    if (typeof displayName !== "string" || !displayName.trim() || displayName.trim().length > 100) {
        return res.status(400).json({ message: "Display name is required and must be 100 characters or fewer." });
    }
    if (bio !== undefined && (typeof bio !== "string" || bio.length > 1000)) {
        return res.status(400).json({ message: "Bio must be text with 1000 characters or fewer." });
    }

    const updates = {
        displayName: displayName.trim(),
        ...(bio !== undefined ? { bio: bio.trim() } : {})
    };
    if (profileImage !== undefined) {
        if (typeof profileImage !== "string" || profileImage.length > 2048) {
            return res.status(400).json({ message: "Choose a valid profile image." });
        }
        const match = /^\/api\/media\/([a-f\d]{24})$/i.exec(profileImage);
        let isExternalImage = false;
        if (profileImage && !match) {
            try {
                const parsed = new URL(profileImage);
                isExternalImage = ["http:", "https:"].includes(parsed.protocol);
            } catch {
                isExternalImage = false;
            }
        }
        if (profileImage && !match && !isExternalImage) {
            return res.status(400).json({ message: "Upload your profile image before saving." });
        }
        if (match) {
            const image = await Media.findOne({ _id: match[1], ownerId: req.userId }).select("_id");
            if (!image) return res.status(400).json({ message: "The selected profile image is not available to this account." });
        }
        updates.profileImage = profileImage;
    }

    const creator = await User.findByIdAndUpdate(req.userId, updates, {
        new: true,
        runValidators: true
    }).select("displayName bio profileImage");
    if (!creator) return res.status(404).json({ message: "Creator account not found." });

    return res.json({
        message: "Profile updated successfully.",
        profile: {
            id: creator._id.toString(),
            name: creator.displayName,
            bio: creator.bio,
            profileImage: creator.profileImage
        }
    });
}));

router.get("/:creatorId", asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.creatorId)) {
        return res.status(400).json({ message: "Invalid creator ID." });
    }

    const creator = await User.findOne({
        _id: req.params.creatorId,
        role: "creator"
    }).select("displayName bio profileImage");
    if (!creator) return res.status(404).json({ message: "Creator profile not found." });

    const contents = await Content.find({
        ownerId: creator._id,
        status: "Published"
    }).sort({ publishedAt: -1, createdAt: -1 });
    const contentIds = contents.map(content => content._id);
    const [likes, comments] = await Promise.all([
        Like.aggregate([
            { $match: { contentId: { $in: contentIds } } },
            { $group: { _id: "$contentId", count: { $sum: 1 } } }
        ]),
        Comment.aggregate([
            { $match: { contentId: { $in: contentIds }, status: "Approved" } },
            { $group: { _id: "$contentId", count: { $sum: 1 } } }
        ])
    ]);
    const likesByContent = new Map(likes.map(item => [item._id.toString(), item.count]));
    const commentsByContent = new Map(comments.map(item => [item._id.toString(), item.count]));

    return res.json({
        profile: {
            id: creator._id.toString(),
            name: creator.displayName,
            bio: creator.bio,
            profileImage: creator.profileImage
        },
        posts: contents.map(content => {
            const post = content.toObject();
            delete post.ownerId;
            return {
                ...post,
                contentType: content.type.toLowerCase(),
                thumbnail: content.thumbnailUrl || "",
                mediaUrls: content.mediaUrls || [],
                publicationDate: content.publishedAt || content.createdAt,
                views: content.viewCount || 0,
                likesCount: likesByContent.get(content._id.toString()) || 0,
                commentsCount: commentsByContent.get(content._id.toString()) || 0
            };
        })
    });
}));

router.get("/", asyncHandler(async (req, res) => {
    const creator = await User.findOne({ role: "creator" }).select("displayName bio profileImage");
    if (!creator) {
        return res.json({
            id: "",
            name: "Sociee",
            bio: "Discover, learn and connect with amazing content.",
            profileImage: ""
        });
    }

    return res.json({
        id: creator._id.toString(),
        name: creator.displayName,
        bio: creator.bio,
        profileImage: creator.profileImage
    });
}));

module.exports = router;
