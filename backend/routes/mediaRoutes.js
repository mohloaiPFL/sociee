const express = require("express");
const multer = require("multer");
const Media = require("../models/media");
const authenticate = require("../middleware/authenticate");
const { asyncHandler, isValidObjectId } = require("../utils/http");

const router = express.Router();
const maxFileSize = 12 * 1024 * 1024;
const allowedTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "audio/mpeg",
    "audio/mp4",
    "audio/wav",
    "audio/ogg",
    "audio/webm"
]);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSize, files: 10 }
});

router.post("/upload", authenticate, (req, res, next) => {
    upload.array("files", 10)(req, res, error => {
        if (!error) return next();
        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({ message: "Each photo or video must be 12 MB or smaller." });
        }
        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({ message: "Upload no more than 10 files at a time." });
        }
        if (error instanceof multer.MulterError) {
            return res.status(400).json({ message: "The selected media files could not be uploaded." });
        }
        return next(error);
    });
}, asyncHandler(async (req, res) => {
    if (!req.files?.length) {
        return res.status(400).json({ message: "Choose at least one photo or video to upload." });
    }
    if (req.files.some(file => !allowedTypes.has(file.mimetype))) {
        return res.status(400).json({
            message: "Supported files are JPG, PNG, WebP, GIF, MP4, WebM, MOV, MP3, M4A, WAV, and OGG."
        });
    }

    const records = await Media.insertMany(req.files.map(file => ({
        ownerId: req.userId,
        data: file.buffer,
        mimeType: file.mimetype,
        originalName: file.originalname.replace(/[^\w.-]/g, "_").slice(0, 255) || "upload",
        size: file.size
    })));

    return res.status(201).json({
        files: records.map(media => ({
            id: media._id.toString(),
            url: `/api/media/${media._id}`,
            mimeType: media.mimeType,
            name: media.originalName
        }))
    });
}));

router.get("/:id", asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid media ID." });
    }
    const media = await Media.findById(req.params.id).select("data mimeType originalName");
    if (!media) return res.status(404).json({ message: "Media not found." });

    res.set({
        "Content-Type": media.mimeType,
        "Content-Length": media.data.length,
        "Content-Disposition": `inline; filename="${media.originalName}"`,
        "Cross-Origin-Resource-Policy": "cross-origin",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable"
    });
    return res.send(media.data);
}));

module.exports = router;
