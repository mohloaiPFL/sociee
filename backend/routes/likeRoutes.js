const express = require("express");
const Content = require("../models/content");
const Like = require("../models/like");
const { asyncHandler, isValidObjectId } = require("../utils/http");

const router = express.Router();

router.post("/", asyncHandler(async (req, res) => {
    const { contentId, viewerKey } = req.body;
    if (!isValidObjectId(contentId)) return res.status(400).json({ message: "A valid content ID is required." });
    if (typeof viewerKey !== "string" || !viewerKey.trim() || viewerKey.trim().length > 128) {
        return res.status(400).json({ message: "A valid viewer key is required." });
    }
    const content = await Content.findOne({ _id: contentId, status: "Published" }).select("_id");
    if (!content) return res.status(404).json({ message: "Published content not found." });

    let liked = true;
    try {
        await Like.create({ contentId, viewerKey: viewerKey.trim() });
    } catch (error) {
        if (error.code !== 11000) throw error;
        liked = false;
    }
    const count = await Like.countDocuments({ contentId });
    await Content.updateOne({ _id: contentId }, { likesCount: count });
    return res.status(liked ? 201 : 200).json({ liked: true, alreadyLiked: !liked, count });
}));

module.exports = router;
