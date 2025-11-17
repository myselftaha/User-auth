// index.js

const express = require("express");
const path = require("path");
// Assuming these are correct paths to your database logic
const { connectToDatabase, collection } = require("./config");
const bcrypt = require('bcrypt');

const app = express();
// convert data into json format
app.use(express.json());
// Static file
app.use(express.static("public"));

app.use(express.urlencoded({ extended: false }));
//use EJS as the view engine
app.set("view engine", "ejs");

// Define Port for Application 
const port = 5000;

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

// Register User
app.post("/signup", async (req, res) => {
    // CRITICAL FIX: Ensure DB is connected before doing Mongoose operations
    try {
        await connectToDatabase();
    } catch (dbError) {
        console.error("Failed to connect to DB for signup:", dbError);
        return res.status(500).send("Server Error: Database connection failed.");
    }
    
    const data = {
        name: req.body.username,
        password: req.body.password
    }

    // Check if the username already exists in the database
    try {
        const existingUser = await collection.findOne({ name: data.name });

        if (existingUser) {
            res.send('User already exists. Please choose a different username.');
        } else {
            // Hash the password using bcrypt
            const saltRounds = 10; // Number of salt rounds for bcrypt
            const hashedPassword = await bcrypt.hash(data.password, saltRounds);

            data.password = hashedPassword; // Replace the original password with the hashed one

            // CORRECTED: Use .create() instead of .insertMany() for single document insertion
            const userdata = await collection.create(data); 
            console.log("New user created:", userdata);

            res.redirect("/");
        }
    } catch (err) {
        console.error("Signup DB operation failed:", err);
        res.status(500).send("Signup failed due to server error.");
    }
});

// Login user 
app.post("/login", async (req, res) => {
    // CRITICAL FIX: Ensure DB is connected before doing Mongoose operations
    try {
        await connectToDatabase(); 
    } catch (dbError) {
        console.error("Failed to connect to DB for login:", dbError);
        return res.status(500).send("Server Error: Database connection failed.");
    }
    
    try {
        const check = await collection.findOne({ name: req.body.username });
        if (!check) {
            res.send("User name cannot found")
        }
        // Compare the hashed password from the database with the plaintext password
        else { // Added an 'else' block to handle the case where the user is found
            const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
            if (!isPasswordMatch) {
                res.send("wrong Password");
            }
            else {
                res.render("home");
            }
        }
    }
    catch (err) {
        console.error("Login DB operation failed:", err);
        // Ensure that if 'check' is null (user not found), you don't access check.password
        // The logic above handles this, but a generic error catch is here too.
        res.send("wrong Details"); 
    }
});

// Vercel Entry Point (Crucial for Vercel deployment)
module.exports = app;

// 🟢 NEW: Local Server Startup Logic
// This block ensures the server only starts listening when the file is run directly (e.g., via nodemon)
// but not when it's imported as a module (e.g., by Vercel).
if (require.main === module) {
    app.listen(port, () => {
        console.log(`\n\n🟢 Server Running at http://localhost:${port}`);
        console.log(`\n============================================`);
        console.log(`Project: User-auth`);
        console.log(`Environment: Local Development`);
        console.log(`--------------------------------------------`);
        console.log(`Hit CTRL+C to stop the server.`);
        console.log(`============================================\n`);
    });
}