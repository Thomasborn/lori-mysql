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
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*', // Replace with the frontend URL or set to '*' for any domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
  credentials: true, // Allow cookies to be sent with requests
}));
const PORT = process.env.PORT;
app.get("/api",(req,res) => {
    res.send("Hello World");
});

app.use(cookieParser());
app.use(
    session({
      secret: 'lori',
      resave: false,
      saveUninitialized: true,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours (in milliseconds)
    },
    })
  );

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