const express = require("express");
const prisma = require("../db");
const multer = require("multer");
const upload = multer();
const {
  getRak,
  insertRak,
  updatedRak,
  getRakById,
  deleteRakById,
} = require("./rak.service");
const { findRakById } = require("./rak.repository");

const router = express.Router();
router.get("/", async (req, res) => {
    // Extract pagination parameters from the request query
    const {q,page = 1, itemsPerPage = 10 } = req.query;

    // Call getRak function with pagination parameters
    const rak = await getRak(q,parseInt(page), parseInt(itemsPerPage));

    // Send the response
    res.send(rak);

});

router.get("/:id", async (req, res) => {
    try {
      const rakId = parseInt(req.params.id);
      const rak = await getRakById(parseInt(rakId));
  
      res.send(rak);
    } catch (err) {
      res.status(400).send(err.message);
    }
});

router.post("/", upload.none(), async (req, res) => {
    try {
        const newRakData = req.body;
        const rak = await insertRak(newRakData);
  
        res.send({
          success : rak.success,
          message: rak.message,
          data: rak.data,
        });
    } catch (error) {
      console.error('Error creating rak:', error);
      res.status(500).json({ error: 'Sedang terjadi kesalahan di server, silahkan coba beberapa saat lagi' });
    }
});

router.put("/:id", upload.none(), async (req, res) => {
    const { id } = req.params;
    const updatedRakData = req.body;
     
    try {
        const existRak = await getRakById(parseInt(id));
        if (!existRak) {
          res.send({success : false, message: "Rak dengan id: " + id + " tidak ditemukan"});
        }
        // Check if the rak exists before attempting to update it
        const rak = await updatedRak(parseInt(id), updatedRakData);
    
        res.send({
          success : rak.success,
          message: rak.message,
          data: rak.data,
        });
    } catch (error) {
        console.error('Error updating rak:', error);
        res.status(500).json({ error: 'Sedang terjadi kesalahan di server, silahkan coba beberapa saat lagi' });
    }
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // Check if the rak exists
        const rak = await findRakById(parseInt(id));
    
        // If the rak doesn't exist, send a 404 response
        if (!rak) {
          return res.status(404).json({ error: 'Rak not found' });
        }

        // If the rak exists, delete it
        const deleteRak = await deleteRakById(parseInt(id));

        // Send success response
        res.json(deleteRak);
    } catch (error) {
        // Handle errors
        console.error('Error deleting rak:', error);
        res.status(500).json({ error: 'Sedang terjadi kesalahan di server, silahkan coba beberapa saat lagi' });
    }
});

module.exports = router;
