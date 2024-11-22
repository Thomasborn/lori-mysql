
const prisma = require("../db");
const findQcProduk = async (queryParams) => {
  const {
    bulanTemuan,
    tahunTemuan,
    bulanSelesai,
    tahunSelesai,
    status,
    itemsPerPage = 10,
    page = 1,
  } = queryParams;

  const skip = (page - 1) * itemsPerPage;
  const take = parseInt(itemsPerPage);

  // Constructing the filters
  const filters = {};
  if (status) {
    filters.status = status;
  }
  if (bulanTemuan && tahunTemuan) {
    const startTemuanDate = new Date(`${tahunTemuan}-${bulanTemuan}-01`);
    const endTemuanDate = new Date(startTemuanDate);
    endTemuanDate.setMonth(startTemuanDate.getMonth() + 1);

    filters.created_at = {
      gte: startTemuanDate,
      lt: endTemuanDate,
    };
  }
  if (bulanSelesai && tahunSelesai) {
    const startSelesaiDate = new Date(`${tahunSelesai}-${bulanSelesai}-01`);
    const endSelesaiDate = new Date(startSelesaiDate);
    endSelesaiDate.setMonth(startSelesaiDate.getMonth() + 1);

    filters.updated_at = {
      gte: startSelesaiDate,
      lt: endSelesaiDate,
    };
  }

  // Querying QC Produk
  const [qc_produk, totalData] = await Promise.all([
    prisma.qc_produk.findMany({
      skip,
      take,
      where: filters,
      include: {
        produk: {
          include: {
            detail_model_produk: {
              include: {
                model_produk: true, // Include the entire model_produk object
              },
            },
          },
        },
        user: {
          include: {
            karyawan: true, // Include the entire karyawan object
          },
        },
      },
    }),
    prisma.qc_produk.count({ where: filters }), // Total data count
  ]);

  const totalPages = Math.ceil(totalData / take);

  // Reshaping data
  const reshapedData = qc_produk.map((qc) => ({
    id: qc.id,
    tanggalTemuan: qc.tanggal_temuan ? qc.tanggal_temuan.toLocaleDateString() : null,
    tanggalSelesai: qc.tanggal_selesai ? qc.tanggal_selesai.toLocaleDateString() : null,
    idProduk: qc.produk?.id, // Use optional chaining to avoid errors
    kodeProduk: qc.produk?.detail_model_produk?.model_produk?.kode,
    namaProduk: qc.produk?.detail_model_produk?.model_produk?.nama,
    ukuranProduk: qc.produk?.ukuran,
    jumlah: qc.jumlah,
    tindakan: qc.tindakan,
    status: qc.status,
    catatan: qc.catatan,
    idPenggunaQc: qc.user?.id, // Use optional chaining
    namaPenggunaQc: qc.user?.karyawan?.nama || null, // Use optional chaining
  }));

  return {
    success: true,
    message: "Data QC produk berhasil diperoleh",
    dataTitle: "QC Produk",
    itemsPerPage: take,
    totalPages,
    totalData,
    page: page || "1",
    data: reshapedData,
  };
};

const findQcProdukById = async (id) => {
  try {
    const qc_produk = await prisma.qc_produk.findUnique({
      where: {
        id,
      },
      include: {
        produk: {
          include: {
            detail_model_produk: {
              include: {
                model_produk: {
                  include: {
                    kategori: true, // Assuming you want to include 'kategori' from 'model_produk'
                  },
                },
              },
            },
          },
        },
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
      idOutlet: qc_produk.produk.id, // Assuming 'produk' has 'id' as outlet ID
      namaOutlet: qc_produk.produk.nama, // Assuming 'produk' has 'nama' as outlet name
      idVarian: qc_produk.produk.id, // Assuming 'produk' has 'id' as variant ID
      kodeProduk: qc_produk.produk.detail_model_produk.model_produk.kode,
      namaProduk: qc_produk.produk.detail_model_produk.model_produk.nama,
      kategoriProduk: qc_produk.produk.detail_model_produk.model_produk.kategori.nama,
      ukuranProduk: qc_produk.produk.ukuran,
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
  } catch (error) {
    console.error(error); // Log the error for debugging

    return {
      success: false,
      message: `Terjadi kesalahan saat mengambil data QC produk: ${error.message}`,
      data: null,
    };
  }
};
const insertQcProdukRepo = async (newprodukData) => {
  try {
    // Parse the date in DD/MM/YYYY format
    const parsedTanggalTemuan = new Date(
      newprodukData.tanggalTemuan.split('/').reverse().join('-')
    );

    // Check if the produk_id exists in the produk_outlet table
    const produkExists = await prisma.produk_outlet.findUnique({
      where: {
        id: newprodukData.id,
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
        produk_id: newprodukData.id, // Assuming idVarian corresponds to produk_id
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