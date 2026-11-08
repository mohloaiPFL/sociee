const express = require("express");
const mongoose = require("mongoose");
const Content = require("../models/content");
const Comment = require("../models/comment");
const Like = require("../models/like");
const authenticate = require("../middleware/authenticate");
const { asyncHandler } = require("../utils/http");

const router = express.Router();

router.get("/stats", authenticate, asyncHandler(async (req, res) => {
    const ownerId = new mongoose.Types.ObjectId(req.userId);
    const [contentStats] = await Content.aggregate([
        {
            $match: { ownerId }
        },
        {
            $group: {
                _id: null,
                totalContent: { $sum: 1 },
                published: { $sum: { $cond: [{ $eq: ["$status", "Published"] }, 1, 0] } },
                drafts: { $sum: { $cond: [{ $eq: ["$status", "Draft"] }, 1, 0] } },
                scheduled: { $sum: { $cond: [{ $eq: ["$status", "Scheduled"] }, 1, 0] } },
                views: { $sum: "$viewCount" }
            }
        }
    ]);
    const contentIds = await Content.find({ ownerId: req.userId }).distinct("_id");
    const [comments, likes] = await Promise.all([
        Comment.countDocuments({ contentId: { $in: contentIds } }),
        Like.countDocuments({ contentId: { $in: contentIds } })
    ]);

    return res.json({
        totalContent: contentStats?.totalContent || 0,
        published: contentStats?.published || 0,
        drafts: contentStats?.drafts || 0,
        scheduled: contentStats?.scheduled || 0,
        comments,
        views: contentStats?.views || 0,
        likes
    });
}));

module.exports = router;
