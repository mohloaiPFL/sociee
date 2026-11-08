const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    data: {
        type: Buffer,
        required: true
    },
    mimeType: {
        type: String,
        required: true,
        enum: [
            "image/jpeg", "image/png", "image/webp", "image/gif",
            "video/mp4", "video/webm", "video/quicktime",
            "audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg", "audio/webm"
        ]
    },
    originalName: {
        type: String,
        required: true,
        maxlength: 255
    },
    size: {
        type: Number,
        required: true,
        max: 12 * 1024 * 1024
    }
}, { timestamps: true });

module.exports = mongoose.model("Media", mediaSchema);
