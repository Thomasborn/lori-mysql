
const prisma = require("../db");
const findQcProduk = async (query) => {
  const {
    q,
    bulanTemuan,
    tahunTemuan,
    bulanSelesai,
    tahunSelesai,
    status,
    itemsPerPage,
    page,
  } = query;

  const take = parseInt(itemsPerPage) || 10;
  const skip = ((parseInt(page) || 1) - 1) * take;

  const where = {
    AND: [
      bulanTemuan && tahunTemuan
        ? { tanggal_temuan: { gte: new Date(tahunTemuan, bulanTemuan - 1, 1) } }
        : {},
      bulanSelesai && tahunSelesai
        ? { tanggal_selesai: { lte: new Date(tahunSelesai, bulanSelesai, 0) } }
        : {},
      status ? { status: status } : {},
      q ? { user: { karyawan: { nama: { contains: q, lte: 'insensitive' } } } } : {},
    ],
  };

 const qc_produk = await prisma.qc_produk.findMany({
  where,
  select: {
    id: true,  // Scalar fields you need
    produk: {
      select: {
        id: true,  // Nested fields in related models
      },
    },
    user: {
      select: {
        id: true,
        karyawan: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    },
  },
  take,
  skip,
});


  const totalData = await prisma.qc_produk.count({ where });

  const reshapedData = qc_produk.map((qc) => ({
    id: qc.id,
    tanggalTemuan: qc.tanggal_temuan ? qc.tanggal_temuan.toLocaleDateString() : null,
    tanggalSelesai: qc.tanggal_selesai ? qc.tanggal_selesai.toLocaleDateString() : null,
    idProduk: qc.produk_outlet.id,
    kodeProduk: qc.produk_outlet.kode,
    namaProduk: qc.produk_outlet.nama,
    kategoriProduk: qc.produk_outlet.kategori,
    ukuranProduk: qc.produk_outlet.ukuran,
    jumlah: qc.jumlah,
    tindakan: qc.tindakan,
    status: qc.status,
    catatan: qc.catatan,
    idPenggunaQc: qc.user.id,
    namaPenggunaQc: qc.user.karyawan ? qc.user.karyawan.nama : null,
  }));

  return {
    success: true,
    message: "Data QC produk berhasil diperoleh",
    dataTitle: "QC Bahan",
    itemsPerPage: take,
    totalPages: Math.ceil(totalData / take),
    totalData,
    page: page || "1",
    data: reshapedData,
  };
};
const findQcProdukById = async (id) => {
  const qc_produk = await prisma.qc_produk.findUnique({
    where: { id },
    include: {
      produk: true,
      user: {
        include: {
          karyawan: true,
        },
      },
    },
  });

  if (!qc_produk) {
    return {
      success: false,
      message: `Data QC produk dengan ID ${id} tidak ditemukan`,
      data: null,
    };
  }

  const reshapedData = {
    id: qc_produk.id,
    tanggalTemuan: qc_produk.tanggal_temuan ? qc_produk.tanggal_temuan.toLocaleDateString() : null,
    tanggalSelesai: qc_produk.tanggal_selesai ? qc_produk.tanggal_selesai.toLocaleDateString() : null,
    idOutlet: qc_produk.produk_outlet.id, // Assuming 'produk_outlet' has 'id' as outlet ID
    namaOutlet: qc_produk.produk_outlet.nama, // Assuming 'produk_outlet' has 'nama' as outlet name
    idVarian: qc_produk.produk_outlet.id, // Assuming 'produk_outlet' has 'id' as variant ID
    kodeProduk: qc_produk.produk_outlet.kode,
    namaProduk: qc_produk.produk_outlet.nama,
    kategoriProduk: qc_produk.produk_outlet.kategori,
    ukuranProduk: qc_produk.produk_outlet.ukuran,
    jumlah: qc_produk.jumlah,
    tindakan: qc_produk.tindakan,
    status: qc_produk.status,
    catatan: qc_produk.catatan,
    idPenggunaQc: qc_produk.user.id,
    namaPenggunaQc: qc_produk.user.karyawan ? qc_produk.user.karyawan.nama : null,
    rolePenggunaQc: qc_produk.user.karyawan ? qc_produk.user.karyawan.role : null,
    kontakPenggunaQc: qc_produk.user.karyawan ? qc_produk.user.karyawan.kontak : null,
  };

  return {
    success: true,
    message: `Data QC produk dengan ID ${id} berhasil diperoleh`,
    data: reshapedData,
  };
};const insertQcProdukRepo = async (newprodukData) => {
  try {
    // Parse the date in DD/MM/YYYY format
    const parsedTanggalTemuan = new Date(
      newprodukData.tanggalTemuan.split('/').reverse().join('-')
    );

    // Check if the produk_id exists in the produk_outlet table
    const produkExists = await prisma.produk_outlet.findUnique({
      where: {
        id: newprodukData.idVarian,
      },
    });

    if (!produkExists) {
      return {
        success: false,
        message: 'Produk ID tidak ditemukan',
      };
    }

    const newQcProduk = await prisma.qc_produk.create({
      data: {
        tanggal_temuan: parsedTanggalTemuan,
        tindakan: newprodukData.tindakan,
        jumlah: parseInt(newprodukData.jumlah),
        catatan: newprodukData.catatan || '', // Optional field, provide a default if not present
        status: newprodukData.status,
        produk_id: newprodukData.idVarian, // Assuming idVarian corresponds to produk_id
        user_id: newprodukData.idPenggunaQc,
      },
    });

    const response = {
      success: true,
      message: `Data QC produk berhasil ditambahkan dengan ID ${newQcProduk.id}`,
      data: {
        id: newQcProduk.id,
        tanggalSelesai: newQcProduk.tanggal_selesai,
        tanggalTemuan: newprodukData.tanggalTemuan,
        idVarian: newprodukData.idVarian,
        kodeProduk: newprodukData.kodeProduk,
        namaProduk: newprodukData.namaProduk,
        kategoriProduk: newprodukData.kategoriProduk,
        ukuranProduk: newprodukData.ukuranProduk,
        jumlah: newprodukData.jumlah,
        tindakan: newprodukData.tindakan,
        status: newprodukData.status,
        idPenggunaQc: newprodukData.idPenggunaQc,
        namaPenggunaQc: newprodukData.namaPenggunaQc,
        idOutlet: newprodukData.idOutlet,
        namaOutlet: newprodukData.namaOutlet,
      },
    };

    return response;
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Terjadi kesalahan saat menambahkan data QC produk',
      error: error.message,
    };
  }
};




const updateQcProdukRepo = async (id,updatedProdukData) => {
        const existingProduk = await prisma.qc_produk.findUnique({
          where: { id: parseInt(id) },
        });
        
        if (!existingProduk) {
            return res.status(404).json({ error: "qc_produk not found" });
      }

      // Validate and update the qc_produk data
      const updatedProduk = await prisma.qc_produk.update({
      where: { id: parseInt(id) },
      data: {
          // Add validation and update fields as needed
          kode_produk: updatedProdukData.kode_produk || existingProduk.kode_produk,
          sku: updatedProdukData.sku || existingProduk.sku,
          nama_produk: updatedProdukData.nama_produk || existingProduk.nama_produk,
          stok: parseInt(updatedProdukData.stok) || existingProduk.stok,
      harga_jual: parseFloat(updatedProdukData.harga_jual) || existingProduk.harga_jual,

      },
      });
      return updatedProduk
}
const deleteQcProdukByIdRepo = async(id)=>{
  await prisma.qc_produk.delete({
    where: { id: id },
  });
}
module.exports={
  findQcProduk,
  findQcProdukById,
  insertQcProdukRepo,
  updateQcProdukRepo,
  deleteQcProdukByIdRepo
}