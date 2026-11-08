const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Content = require("../models/content");
const { asyncHandler } = require("../utils/http");

const router = express.Router();

function createToken(user) {
    return jwt.sign(
        { sub: user._id.toString(), role: user.role },
        process.env.JWT_SECRET || process.env.DEV_JWT_SECRET,
        { expiresIn: "12h" }
    );
}

router.get("/setup-status", asyncHandler(async (req, res) => {
    const setupComplete = await User.exists({});
    res.json({ setupComplete: Boolean(setupComplete), registrationAllowed: true });
}));

async function register(req, res) {
    const { email, password, displayName } = req.body;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedName = typeof displayName === "string" ? displayName.trim() : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
        return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (typeof password !== "string" || password.length < 12 || password.length > 128) {
        return res.status(400).json({ message: "Password must be between 12 and 128 characters." });
    }
    if (!normalizedName || normalizedName.length > 100) {
        return res.status(400).json({ message: "Creator name is required and must be 100 characters or fewer." });
    }

    try {
        const user = await User.create({
            email: normalizedEmail,
            passwordHash: await bcrypt.hash(password, 12),
            displayName: normalizedName
        });
        const firstCreator = await User.findOne().sort({ createdAt: 1, _id: 1 }).select("_id");
        if (firstCreator) {
            await Content.updateMany(
                { ownerId: null },
                { $set: { ownerId: firstCreator._id } }
            );
        }
        return res.status(201).json({
            token: createToken(user),
            user: { email: user.email, displayName: user.displayName }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "An account with this email already exists." });
        }
        throw error;
    }
}

router.post("/register", asyncHandler(register));
router.post("/setup", asyncHandler(register));

router.post("/login", asyncHandler(async (req, res) => {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.json({
        token: createToken(user),
        user: { email: user.email, displayName: user.displayName }
    });
}));

module.exports = router;
