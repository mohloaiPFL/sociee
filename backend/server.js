
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const publishScheduledContent = require("./utils/publishScheduled");
const User = require("./models/user");
const Content = require("./models/content");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
app.set("trust proxy", 1);
const allowedOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be configured in production.");
}
if (!process.env.JWT_SECRET) {
    process.env.DEV_JWT_SECRET = crypto.randomBytes(32).toString("hex");
    console.warn("JWT_SECRET is not set; using a temporary local-development secret.");
}

app.use(helmet());
app.use(cors({
    origin(origin, callback) {
        if (!origin || process.env.NODE_ENV !== "production" || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("This origin is not allowed by CORS."));
    }
}));
app.use(express.json({ limit: "1mb" }));

const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: "Too many authentication attempts. Try again later." }
});

app.use("/api/auth", authRateLimit, require("./routes/authRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/media", require("./routes/mediaRoutes"));
app.use("/api/contents", require("./routes/contentRoutes"));
app.use("/api/comments", require("./routes/commentRoutes"));
app.use("/api/likes", require("./routes/likeRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

app.get("/health", (req, res) => {
    res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.get("/", (req, res) => {
    res.send("Backend server is running successfully!");
});

app.use((req, res) => {
    res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Request body must contain valid JSON." });
    }
    if (error.message === "This origin is not allowed by CORS.") {
        return res.status(403).json({ message: error.message });
    }
    if (error.statusCode === 400 || error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) {
        return res.status(409).json({ message: "A record with those details already exists." });
    }
    console.error("API request failed:", error.message);
    return res.status(500).json({ message: "An unexpected server error occurred." });
});

async function startServer() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (typeof mongoUri !== "string" || !mongoUri.trim()) {
        throw new Error(
            "MongoDB URI is missing. Set MONGODB_URI in backend/.env (or provide MONGO_URI)."
        );
    }

    await mongoose.connect(mongoUri.trim());
    console.log("MongoDB connected successfully!");

    const usersCollectionExists = await mongoose.connection.db
        .listCollections({ name: User.collection.name }, { nameOnly: true })
        .hasNext();
    if (usersCollectionExists) {
        const userIndexes = await User.collection.indexes();
        const uniqueRoleIndex = userIndexes.find(index => index.name === "role_1" && index.unique);
        if (uniqueRoleIndex) {
            await User.collection.dropIndex(uniqueRoleIndex.name);
        }
    }

    const firstCreator = await User.findOne().sort({ createdAt: 1, _id: 1 }).select("_id");
    if (firstCreator) {
        await Content.updateMany(
            { ownerId: null },
            { $set: { ownerId: firstCreator._id } }
        );
    }

    await publishScheduledContent();
    const scheduleTimer = setInterval(() => {
        publishScheduledContent().catch(error => console.error("Scheduled publishing failed:", error.message));
    }, 60 * 1000);
    scheduleTimer.unref();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer().catch((error) => {
    if (error.codeName === "AuthenticationFailed" || /bad auth|authentication failed/i.test(error.message)) {
        console.error(
            "MongoDB authentication failed. Check the MongoDB database user's username and password, confirm the authentication database (authSource), and URL-encode any reserved characters in the credentials. Do not share the connection URI."
        );
    } else {
        console.error("Backend startup failed:", error.message);
    }
    process.exitCode = 1;
});

module.exports = app;
