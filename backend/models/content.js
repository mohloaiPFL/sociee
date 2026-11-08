
const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 10000
    },
    category: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80
    },
    type: {
        type: String,
        enum: ["Video", "Article", "Podcast", "Image"],
        required: true
    },
    thumbnailUrl: {
        type: String,
        default: "",
        maxlength: 2048
    },
    mediaUrl: {
        type: String,
        default: "",
        maxlength: 2048
    },
    mediaUrls: {
        type: [{
            type: String,
            maxlength: 2048
        }],
        default: []
    },
    articleContent: {
        type: String,
        default: "",
        maxlength: 100000
    },
    status: {
        type: String,
        enum: ["Draft", "Published", "Scheduled"],
        default: "Draft"
    },
    scheduledAt: {
        type: Date,
        default: null
    },
    publishedAt: {
        type: Date,
        default: null
    },
    viewCount: {
        type: Number,
        default: 0,
        min: 0
    },
    likesCount: {
        type: Number,
        default: 0,
        min: 0
    }
}, { timestamps: true });

module.exports = mongoose.model("Content", contentSchema);
