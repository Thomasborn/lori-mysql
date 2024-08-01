
const express = require("express");
const prisma = require("../db");
const multer = require("multer");
const upload = multer();
const {

  deleteaksesById,
} = require("./ability.service");

const router = express.Router();

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {

    
    // If the akses exists, delete it
   await deleteaksesById(parseInt(id))

    res.json({ message: "akses deleted successfully" });
  } catch (error) {
    console.error('Error deleting akses:', error);
    res.status(500).json({ error: 'Sedang terjadi kesalahan di server, silahkan coba beberapa saat lagi' });
  }
});

module.exports = router;