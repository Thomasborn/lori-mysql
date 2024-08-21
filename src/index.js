const express = require("express")
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser"); // Add cookie-parser
const verifyToken = require("./middleware/auth_jwt");
const verifyAccess = require("./middleware/access");
const { PrismaClient } = require("@prisma/client");
const prisma= new PrismaClient();
const AuthController = require("./auth/auth.controller")
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const router = require('./router/index');
const cors = require("cors"); // Import the cors package
const publicDirectory = path.join(__dirname, 'public');
fs.existsSync(publicDirectory) || fs.mkdirSync(publicDirectory);

dotenv.config();
const  app = express();
// const bodyParser = require('body-parser');
app.use(cookieParser());
app.use(express.static(publicDirectory));
app.use(express.json())
// app.set('trust proxy', 1); // Trust the first proxy in the chain (if behind a proxy like Nginx)

const corsOptions = {
  origin: [
    'https://f60f-2001-448a-4040-8827-8dea-1d75-ad9c-ed9e.ngrok-free.app',
    'https://4c84-2001-448a-4040-3451-3993-677-9063-965b.ngrok-free.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost.devl:5173',
    'https://omahit.online/',
  ], // Replace with your frontend URLs
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
  allowedHeaders: [
    'X-Requested-With',
    'X-HTTP-Method-Override',
    'Content-Type',
    'Accept',
    'Authorization'
  ], // Allow specific headers
  credentials: true, // Allow credentials (cookies, etc.)
};


app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT;
app.get("/apis",(req,res) => {
    res.send("Hello World");
});

app.use(
  session({
    secret: 'lori',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);
app.post('/login', async (req, res) => {
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
});
app.get('/session-check', async (req, res) => {
  try {
    // Check if session and user data exist
    if (req.session ) {
      // Send session data if user is authenticated
      res.json({ session: req.session ,cookie:req.cookies});
    } else {
      // If session or user data is missing, send a 401 response
      res.status(401).json({ message: 'No active session' });
    }
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Error in /session-check:', error);

    // Send a generic error response
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

  // app.use(bodyParser.json());
app.use("/auth",AuthController);  
app.use("/api/auth",AuthController);  
// app.use("/",router);
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use("/api",router);

  

app.listen(PORT, ()=>{
    console.log("JALAN LORI NYA IN PORT: "+PORT);
});