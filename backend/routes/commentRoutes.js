const express = require("express");
const Comment = require("../models/comment");
const Content = require("../models/content");
const authenticate = require("../middleware/authenticate");
const { asyncHandler, isValidObjectId } = require("../utils/http");

const router = express.Router();

router.get("/", authenticate, asyncHandler(async (req, res) => {
    const contentIds = await Content.find({ ownerId: req.userId }).distinct("_id");
    const comments = await Comment.find({ contentId: { $in: contentIds } })
        .populate("contentId", "title")
        .sort({ createdAt: -1 });
    res.json(comments);
}));

router.post("/", asyncHandler(async (req, res) => {
    const contentId = typeof req.body.contentId === "string" ? req.body.contentId : "";
    const displayName = typeof req.body.displayName === "string"
        ? req.body.displayName
        : req.body.name;
    const text = typeof req.body.text === "string" ? req.body.text : req.body.comment;

    if (!isValidObjectId(contentId)) {
        return res.status(400).json({ message: "A valid content ID is required." });
    }
    if (typeof displayName !== "string" || !displayName.trim() || displayName.trim().length > 80) {
        return res.status(400).json({ message: "Display name is required and must be 80 characters or fewer." });
    }
    if (typeof text !== "string" || !text.trim() || text.trim().length > 2000) {
        return res.status(400).json({ message: "Comment is required and must be 2000 characters or fewer." });
    }

    const content = await Content.findOne({ _id: contentId, status: "Published" }).select("_id");
    if (!content) return res.status(404).json({ message: "Published content not found." });

    const comment = await Comment.create({
        contentId,
        displayName: displayName.trim(),
        text: text.trim()
    });
    return res.status(201).json(comment);
}));

router.get("/:contentId", asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.contentId)) {
        return res.status(400).json({ message: "Invalid content ID." });
    }
    const comments = await Comment.find({
        contentId: req.params.contentId,
        status: "Approved"
    }).sort({ createdAt: -1 });
    return res.json(comments);
}));

router.patch("/:id", authenticate, asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid comment ID." });
    const { status } = req.body;
    if (!["Pending", "Approved", "Hidden"].includes(status)) {
        return res.status(400).json({ message: "Status must be Pending, Approved, or Hidden." });
    }
    const contentIds = await Content.find({ ownerId: req.userId }).distinct("_id");
    const comment = await Comment.findOneAndUpdate(
        { _id: req.params.id, contentId: { $in: contentIds } },
        { status },
        { new: true, runValidators: true }
    );
    if (!comment) return res.status(404).json({ message: "Comment not found." });
    return res.json(comment);
}));

router.delete("/:id", authenticate, asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid comment ID." });
    const contentIds = await Content.find({ ownerId: req.userId }).distinct("_id");
    const comment = await Comment.findOneAndDelete({
        _id: req.params.id,
        contentId: { $in: contentIds }
    });
    if (!comment) return res.status(404).json({ message: "Comment not found." });
    return res.json({ message: "Comment deleted successfully." });
}));

module.exports = router;
