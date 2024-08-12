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

const  app = express();
// const bodyParser = require('body-parser');
dotenv.config();
app.use(express.static(publicDirectory));
app.use(express.json())
app.set('trust proxy', 1); // Trust the first proxy in the chain (if behind a proxy like Nginx)

app.use(express.urlencoded({ extended: true }));
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost.devl:5173',
    'https://omahit.online/'
  ], // Replace with your frontend URLs
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
  credentials: true, // Allow credentials (cookies, etc.)
};


app.use(cors(corsOptions));
const PORT = process.env.PORT;
app.get("/apis",(req,res) => {
    res.send("Hello World");
});

app.use(cookieParser());
app.use(
  session({
    secret: 'lori',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

app.get('/session-check', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ session: req.session });
  } else {
    res.status(401).json({ message: 'No active session' });
  }
});
  // app.use(bodyParser.json());
app.use("/auth",AuthController);  
app.use("/api/auth",AuthController);  
// app.use("/",router);
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use("/api",router);

// app.post("/produks", async (req, res) => {
//     const newProdukData = req.body;
//     try {
//       const produk = await prisma.produk_Item.create({
//         data: {
//           kode_produk: newProdukData.kode_produk, // Provide a valid value for kode_produk
//           sku: newProdukData.sku,
//           nama_produk: newProdukData.nama_produk,
//           stok: newProdukData.stok,
//           harga_jual: newProdukData.harga_jual,
//         
//         },
//       });
//       res.json(produk);
//     } catch (error) {
//       console.error('Error creating produk:', error);
//       res.status(500).json({ error: 'Sedang terjadi kesalahan di server, silahkan coba beberapa saat lagi' });
//     }
//   });

 
  

app.listen(PORT, ()=>{
    console.log("JALAN LORI NYA IN PORT: "+PORT);
});