const mongoose = require("mongoose");
const User = require("../models/user");
const Content = require("../models/content");

let connectionPromise;
let initializationPromise;

async function initializeDatabase() {
    const usersCollectionExists = await mongoose.connection.db
        .listCollections({ name: User.collection.name }, { nameOnly: true })
        .hasNext();
    if (usersCollectionExists) {
        const userIndexes = await User.collection.indexes();
        const uniqueRoleIndex = userIndexes.find(index => index.name === "role_1" && index.unique);
        if (uniqueRoleIndex) {
            try {
                await User.collection.dropIndex(uniqueRoleIndex.name);
            } catch (error) {
                if (error.codeName !== "IndexNotFound") throw error;
            }
        }
    }

    const firstCreator = await User.findOne().sort({ createdAt: 1, _id: 1 }).select("_id");
    if (firstCreator) {
        await Content.updateMany(
            { ownerId: null },
            { $set: { ownerId: firstCreator._id } }
        );
    }
}

async function connectToDatabase() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (typeof mongoUri !== "string" || !mongoUri.trim()) {
        throw new Error("MongoDB URI is missing. Set MONGODB_URI in the deployment environment.");
    }
    if (mongoose.connection.readyState === 1) {
        if (!initializationPromise) {
            initializationPromise = initializeDatabase().catch(error => {
                initializationPromise = null;
                throw error;
            });
        }
        await initializationPromise;
        return mongoose.connection;
    }
    if (mongoose.connection.readyState === 0) {
        connectionPromise = null;
    }
    if (!connectionPromise) {
        connectionPromise = mongoose.connect(mongoUri.trim()).catch(error => {
            connectionPromise = null;
            throw error;
        });
    }
    await connectionPromise;
    if (!initializationPromise) {
        initializationPromise = initializeDatabase().catch(error => {
            initializationPromise = null;
            throw error;
        });
    }
    await initializationPromise;
    return mongoose.connection;
}

module.exports = connectToDatabase;
