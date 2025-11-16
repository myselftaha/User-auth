// config.js

// This line is fine for local testing, but Vercel doesn't use a .env file
// It uses variables set in the dashboard. Keep it for local development.
require('dotenv').config();

const mongoose = require("mongoose");

// --- START: Vercel Caching Implementation ---

// Get the connection string from the environment variables (Vercel uses MONGODB_URI convention)
const URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

// Cache the connection globally to prevent timeouts on subsequent requests
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    // 1. Return cached connection if available
    if (cached.conn) {
        return cached.conn;
    }

    // 2. If no promise exists, create a new connection promise
    if (!cached.promise) {
        if (!URI) {
            throw new Error('Database connection URI not found. Check environment variables.');
        }

        const opts = {
            // New Atlas/Mongoose 6+ standard options
            useNewUrlParser: true,
            useUnifiedTopology: true,
            bufferCommands: false, // Recommended for serverless to prevent buffering timeout
        };

        cached.promise = mongoose.connect(URI, opts).then((mongoose) => {
            console.log("Database connected successfully.");
            return mongoose;
        }).catch((error) => {
            console.error("Database connection error:", error.message);
            // Throw the error to stop the application from running without a connection
            throw error;
        });
    }

    // 3. Wait for the connection to complete and cache the connection object
    cached.conn = await cached.promise;
    return cached.conn;
}

// --- END: Vercel Caching Implementation ---


const LoginSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});


const collection = mongoose.model("users", LoginSchema);

// MODIFIED: Export the connection function AND the model
module.exports = {
    connectToDatabase,
    collection
};