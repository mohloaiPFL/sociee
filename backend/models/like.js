const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema({
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Content",
        required: true
    },
    viewerKey: {
        type: String,
        required: true,
        maxlength: 128
    }
}, { timestamps: true });

likeSchema.index({ contentId: 1, viewerKey: 1 }, { unique: true });

module.exports = mongoose.model("Like", likeSchema);
