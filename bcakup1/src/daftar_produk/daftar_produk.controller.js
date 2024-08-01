
const express = require("express");
const prisma = require("../db");
const  { imageUpload, pdfUpload, imageSingleUpload } = require("../middleware/upload-file");
const multer = require("multer");
const upload = multer();
const {
  getDaftarProduk,
  insertDaftarProduk,
  updatedDaftarProduk,
  getDaftarProdukById,
  deleteDaftarProdukById,
} = require("./daftar_produk.service");

const router = express.Router();
router.get("/", async (req, res) => {
    // Extracting query parameters for search and pagination
    const { q, kategori, page = 1, itemsPerPage = 10 } = req.query;

    // Fetching data based on search criteria and pagination
    const result = await getDaftarProduk(q, kategori,parseInt(page, 10), parseInt(itemsPerPage, 10));

    res.send(result);
  } 
);


router.get("/:id", async (req, res) => {
  try {
    const produkId = parseInt(req.params.id, 10);
    if (isNaN(produkId)) {
      return res.status(400).send({ 
        success: false, 
        message: "ID Produk tidak valid", 
        data: null 
      });
    }

    const daftar_produk = await getDaftarProdukById(produkId);
    res.send(daftar_produk);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).send({
      success: false,
      message: 'Terjadi kesalahan di server',
      data: null
    });
  }
});




  router.post("/", imageUpload, async (req, res) => {
    try {
    
        const data = {
          kode: req.body.kode,
          nama: req.body.nama,
          deskripsi: req.body.deskripsi,
          kategori_id: req.body.kategori_id,
          ukuran: req.body.ukuran,
          biaya_jahit: req.body.biaya_jahit,
          variasi: req.body.variasi,
          hpp: req.body.hpp,
          harga_jual: req.body.harga_jual,
          model_produk_id: req.body.model_produk_id,
          bahan_produk:  JSON.parse(req.body.bahan_produk),
          foto: req.files, 
        };
        const daftar_produk = await insertDaftarProduk(data);
      res.send(daftar_produk);
    } catch (error) {
      console.error('Error creating produk:', error);
      res.status(500).json({ error: 'Sedang terjadi kesalahan di server, silahkan coba beberapa saat lagi' });
    }
  });
  router.put("/:id", upload.none(),async (req, res) => {
      const { id } = req.params;
      const updatedDaftarProdukData = req.body;
     
      try {
          // Check if the daftar_produk exists before attempting to update it
        const daftar_produk = await updatedDaftarProduk(parseInt(id),updatedDaftarProdukData)
    
    res.send(daftar_produk);
} catch (error) {
    console.error('Error updating daftar_produk:', error);
    res.status(500).json({ error: 'Sedang terjadi kesalahan di server, silahkan coba beberapa saat lagi' });
}
});
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {

    
    // If the daftar_produk exists, delete it
   const produk = await deleteDaftarProdukById(parseInt(id))

    res.send(produk);
  } catch (error) {
    console.error('Error deleting daftar_produk:', error);
    res.status(500).json({ error: 'Sedang terjadi kesalahan di server, silahkan coba beberapa saat lagi' });
  }
});

module.exports = router;