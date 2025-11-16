// index.js

const express = require("express");
const path = require("path");
// MODIFIED: Destructure the exported items
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

// Define Port for Application (Keep this line for local testing, but Vercel ignores it)
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
    
    // ... rest of your existing signup logic ...
    
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

            const userdata = await collection.insertMany(data);
            console.log(userdata);

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
    
    // ... rest of your existing login logic ...
    
    try {
        const check = await collection.findOne({ name: req.body.username });
        if (!check) {
            res.send("User name cannot found")
        }
        // Compare the hashed password from the database with the plaintext password
        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
        if (!isPasswordMatch) {
            res.send("wrong Password");
        }
        else {
            res.render("home");
        }
    }
    catch (err) {
        console.error("Login DB operation failed:", err);
        res.send("wrong Details"); // Or a more specific error
    }
});


// REMOVED: app.listen should be modified for Vercel

// Vercel Entry Point (Crucial for Vercel deployment)
// Vercel uses this to start your Express app
module.exports = app;