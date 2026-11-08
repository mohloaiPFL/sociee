const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        maxlength: 254
    },
    passwordHash: {
        type: String,
        required: true
    },
    displayName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    bio: {
        type: String,
        default: "",
        maxlength: 1000
    },
    profileImage: {
        type: String,
        default: ""
    },
    role: {
        type: String,
        enum: ["creator"],
        default: "creator"
    }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
