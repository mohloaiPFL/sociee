const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Content",
        required: true,
        index: true
    },
    displayName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80
    },
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Hidden"],
        default: "Pending",
        index: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Comment", commentSchema);
