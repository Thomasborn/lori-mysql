const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const { PrismaClient } = require("@prisma/client");
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const cors = require("cors");

const AuthController = require("./auth/auth.controller");
const router = require('./router/index');

// Initialize environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Directory setup
const publicDirectory = path.join(__dirname, 'public');
if (!fs.existsSync(publicDirectory)) {
  fs.mkdirSync(publicDirectory);
}

// Middleware
app.use(cookieParser());
app.use(express.static(publicDirectory));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost.devl:5173',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Allow credentials (cookies, etc.)
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Session configuration
app.use(
  session({
    secret: 'lori',
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

// Routes
app.get("/apis", (req, res) => {
  res.send("Hello World");
});

app.post('/login', async (req, res) => {
  try {
    // Your login logic
    req.session.user = {
      id: 1,
      role_id: 2,
    };
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ message: 'Session save error' });
      }
      res.json({ message: 'Login successful', session: req.session });
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.get('/session-check', async (req, res) => {
  try {
    if (req.session && req.session.user) {
      res.json({ session: req.session, cookie: req.cookies });
    } else {
      res.status(401).json({ message: 'No active session' });
    }
  } catch (error) {
    console.error('Error in /session-check:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.use("/auth", AuthController);
app.use("/api/auth", AuthController);
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use("/api", router);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port: " + PORT);
});
