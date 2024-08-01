
const express = require("express");
const prisma = require("../db");
const multer = require("multer");
const upload = multer();
const {
  getPenjualan,
  insertPenjualan,
  updatePenjualan,
  getPenjualanById,
  getDetailPenjualanById,
  deletePenjualanById,
  insertDetailPenjualan,
  getDetailPenjualan,
} = require("./penjualan.service");
const { getUserById } = require("../user/user.service");
const router = express.Router();
router.get("/", async (req, res) => {
  const { q, bulanMulai, tahunMulai, bulanSelesai, tahunSelesai, status, itemsPerPage, page } = req.query;

  let query = {
    q,
    bulanMulai,
    tahunMulai,
    bulanSelesai,
    tahunSelesai,
    status,
    itemsPerPage,
    page,
    user_id: req.session.user.id // Default query includes the logged-in user's ID
  };

  try {
    const role = await getUserById(req.session.user.id);

    if (role.data.name === "Owner" || role.data.name === "Admin") {
      // For Owner or Admin, remove the user_id filter
      delete query.user_id;
    }

    const penjualan = await getPenjualan(query);
    res.send(penjualan);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Terjadi kesalahan dalam mendapatkan data penjualan",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
    try {
      const penjualanId = parseInt(req.params.id);
      const penjualan = await getPenjualanById(parseInt(penjualanId));
  
      res.send(penjualan);
    } catch (err) {
      res.status(400).send(err.message);
    }
  });

router.get("/detail-penjualan",async (req,res) => {
    const penjualan =  await getDetailPenjualan();
    res.send(penjualan);
 });

router.get("/detail-penjualan/:id", async (req, res) => {
    try {
      const penjualanId = parseInt(req.params.id);
      const penjualan = await getDetailPenjualanById(parseInt(penjualanId));
  
      res.send(penjualan);
    } catch (err) {
      res.status(400).send(err.message);
    }
  });

  router.post("/detail-penjualan", upload.none(), async (req, res) => {
    try {
    
        const newDetailpenjualanData = req.body;

        const detail_penjualan = await insertDetailPenjualan(newDetailpenjualanData);
    
  
     
      res.send({
        
        data:detail_penjualan,
        message:"detail penjualan berhasil ditambah success"
      });
    } catch (error) {
      console.error('Error creating penjualan:', error);
      res.status(500).json({ error: 'Sedang terjadi kesalahan di server, silahkan coba beberapa saat lagi' });
    }
  });

router.patch("/detail-penjualan/:id", upload.none(),async (req, res) => {
    const { id } = req.params;
    const updatedDetailpenjualanData = req.body;
   
    try {
        // Check if the penjualan exists before attempting to update it
      const detailpenjualan = await updatePenjualan(parseInt(id),updatedDetailpenjualanData)
  
  res.send({data:detailpenjualan, message: "penjualan updated successfully" });
} catch (error) {
  console.error('Error updating penjualan:', error);
  res.status(500).json({ error: 'Sedang terjadi kesalahan di server, silahkan coba beberapa saat lagi' });
}});

router.delete("/detail-penjualan/:id", async (req, res) => {
  const { id } = req.params;
  try {

    
    // If the penjualan exists, delete it
   await deleteDetailpenjualanById(parseInt(id))

    res.json({ message: "detail penjualan deleted successfully" });
  } catch (error) {
    console.error('Error deleting penjualan:', error);
    res.status(500).json({ error: 'Sedang terjadi kesalahan di server, silahkan coba beberapa saat lagi' });
  }
});
router.post("/", upload.none(), async (req, res) => {
    try {
    
        const newpenjualanData = req.body;

        const penjualan = await insertPenjualan(newpenjualanData);
    
  
     
      res.send(penjualan);
    } catch (error) {
      console.error('Error creating penjualan:', error);
      res.status(500).json({ error: 'Sedang terjadi kesalahan di server, silahkan coba beberapa saat lagi' });
    }
  });
router.patch("/:id", upload.none(),async (req, res) => {
      const { id } = req.params;
      const updatePenjualanData = req.body;
     
      try {
          // Check if the penjualan exists before attempting to update it
        const penjualan = await updatePenjualan(parseInt(id),updatePenjualanData)
    
    res.send({data:penjualan, message: "penjualan updated successfully" });
} catch (error) {
    console.error('Error updating penjualan:', error);
    res.status(500).json({ error: 'Sedang terjadi kesalahan di server, silahkan coba beberapa saat lagi' });
}
});
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {

    
    // If the penjualan exists, delete it
   await deletePenjualanById(parseInt(id))

    res.json({ message: "penjualan deleted successfully" });
  } catch (error) {
    console.error('Error deleting penjualan:', error);
    res.status(500).json({ error: 'Sedang terjadi kesalahan di server, silahkan coba beberapa saat lagi' });
  }
});

module.exports = router;