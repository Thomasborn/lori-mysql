
const prisma = require("../db");
const findQcBahan = async (queryParams) => {
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
      lt: endTemuanDate
    };
  }
  if (bulanSelesai && tahunSelesai) {
    const startSelesaiDate = new Date(`${tahunSelesai}-${bulanSelesai}-01`);
    const endSelesaiDate = new Date(startSelesaiDate);
    endSelesaiDate.setMonth(startSelesaiDate.getMonth() + 1);

    filters.updated_at = {
      gte: startSelesaiDate,
      lt: endSelesaiDate
    };
  }

  const [qc_bahan, totalData] = await Promise.all([
    prisma.qc_bahan.findMany({
      skip,
      take: parseInt(itemsPerPage),
      where: filters,
      include: {
        daftar_bahan: true,
        user: {
          include: {
          karyawan: true
        },
      }
      },
    }),
    prisma.qc_bahan.count({ where: filters }),
  ]);

  const totalPages = Math.ceil(totalData / itemsPerPage);

  const formattedData = qc_bahan.map(item => ({
    id: item.id,
    tanggalTemuan: item.created_at.toISOString().split('T')[0],
    tanggalSelesai: item.updated_at.toISOString().split('T')[0],
    idBahan: item.daftar_bahan.id,
    kodeBahan: item.daftar_bahan.id, // assuming kodeBahan is the same as idBahan
    namaBahan: item.daftar_bahan.nama,
    satuanBahan: item.daftar_bahan.satuan,
    kategoriBahan: item.daftar_bahan.kategori,
    jumlah: item.jumlah,
    tindakan: item.tindakan,
    status: item.status,
    catatan: item.catatan,
    idPenggunaQc: item.user.id,
    namaPenggunaQc: item.user.karyawan.nama,
  }));

  const response = {
    success: true,
    message: "Data QC bahan berhasil diperoleh",
    dataTitle: "QC Bahan",
    itemsPerPage: parseInt(itemsPerPage),
    totalPages,
    totalData,
    page: parseInt(page),
    data: formattedData,
  };

  return response;
};const findQcBahanById = async (id) => {
  const qc_bahan = await prisma.qc_bahan.findUnique({
    where: {
      id,
    },
    include: {
      daftar_bahan: true,
      user: {
        include: {
          karyawan: true,
          role: true
        }
      },
    },
  });

  if (!qc_bahan) {
    return {
      success: false,
      message: `Data QC bahan dengan id ${id} tidak ditemukan`,
    };
  }

  const formattedData = {
    id: qc_bahan.id,
    tanggalTemuan: qc_bahan.created_at.toISOString().split('T')[0],
    tanggalSelesai: qc_bahan.updated_at.toISOString().split('T')[0],
    idBahan: qc_bahan.daftar_bahan.id,
    kodeBahan: qc_bahan.daftar_bahan.id, // assuming kodeBahan is the same as idBahan
    namaBahan: qc_bahan.daftar_bahan.nama,
    satuanBahan: qc_bahan.daftar_bahan.satuan,
    kategoriBahan: qc_bahan.daftar_bahan.kategori,
    jumlah: qc_bahan.jumlah,
    tindakan: qc_bahan.tindakan,
    status: qc_bahan.status,
    catatan: qc_bahan.catatan,
    idPenggunaQc: qc_bahan.user.id,
    namaPenggunaQc: qc_bahan.user.karyawan.nama,
    rolePenggunaQc: qc_bahan.user.role.name,
    kontakPenggunaQc: qc_bahan.user.karyawan.kontak,
  };

  return {
    success: true,
    message: `Data QC bahan dengan ID ${qc_bahan.id} berhasil diperoleh`,
    data: formattedData,
  };
};

const insertQcBahanRepo = async (newprodukData) => {
  try {
    const {
      tanggalTemuan,
      tanggalSelesai,
      idBahan,
      kodeBahan,
      jumlah,
      tindakan,
      status,
      catatan,
      idPenggunaQc,
    } = newprodukData;

    // Fetch daftar_bahan information
    const daftarBahan = await prisma.daftar_bahan.findUnique({
      where: {
        id: idBahan,
      },
    });

    if (!daftarBahan) {
      throw new Error(`Daftar bahan dengan ID ${idBahan} tidak ditemukan`);
    }
    if (!idPenggunaQc) {
      throw new Error('ID pengguna tidak valid.');
    }
    // Fetch user information
    const user = await prisma.user.findUnique({
      where: {
        id: idPenggunaQc,
      },
      include: {
        karyawan: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error(`User dengan ID ${idPenggunaQc} tidak ditemukan`);
    }

    // Perform the insert operation using Prisma
    const createdQcBahan = await prisma.qc_bahan.create({
      data: {
        daftar_bahan: {
          connect: {
            id: idBahan,
          },
        },
        user: {
          connect: {
            id: idPenggunaQc,
          },
        },
        tindakan,
        jumlah:parseInt(jumlah),
        catatan:catatan??"-",
        status,
        // qc_produk_id: kodeBahan,
      },
      include: {
        daftar_bahan: true,
        user: true,
      },
    });

    // Update stok daftar_bahan
    const updatedDaftarBahan = await prisma.daftar_bahan.update({
      where: {
        id: idBahan,
      },
      data: {
        stok: {
          decrement: parseInt(jumlah), // Kurangi stok berdasarkan jumlah QC bahan
        },
      },
    });

    return {
      success: true,
      message: `Data QC bahan berhasil ditambahkan dengan ID ${createdQcBahan.id}`,
      data: {
        id: createdQcBahan.id,
        tanggalTemuan,
        tanggalSelesai,
        idBahan: createdQcBahan.daftar_bahan.id,
        kodeBahan: createdQcBahan.qc_produk_id,
        namaBahan: createdQcBahan.daftar_bahan.nama,
        jumlah: createdQcBahan.jumlah,
        satuan: createdQcBahan.daftar_bahan.satuan,
        tindakan: createdQcBahan.tindakan,
        status: createdQcBahan.status,
        catatan: createdQcBahan.catatan,
        idPenggunaQc: createdQcBahan.user.id,
        namaPengguna: user.nama,
        rolePengguna: user.role.nama,
        kontakPengguna: user.karyawan.kontak,
      },
    };
  } catch (error) {
    console.error('Error inserting qc_bahan:', error);
    return {
      success: false,
      message: 'Gagal menambahkan data QC bahan',
    };
  }
};const updateQcBahanRepo = async (id, updatedProdukData) => {
  try {
    const existingProduk = await prisma.qc_bahan.findUnique({
      where: { id: parseInt(id) },
      include: {
        daftar_bahan: true,
        user: {
          include: {
            role: true,
            karyawan: true,
          },
        },
      },
    });

    if (!existingProduk) {
      throw new Error('Data QC bahan tidak ditemukan');
    }

    // Convert status to lowercase for comparison
    const currentStatus = existingProduk.status.toLowerCase();

    if (currentStatus === 'pulih') {
      throw new Error('Data QC bahan dengan status "Pulih" tidak dapat diperbarui.');
    }

    // Update only status and catatan
    const updatedStatus = updatedProdukData.status ? updatedProdukData.status.toLowerCase() : existingProduk.status.toLowerCase();
    const updatedProduk = await prisma.qc_bahan.update({
      where: { id: parseInt(id) },
      data: {
        status: updatedProdukData.status || existingProduk.status,
        catatan: updatedProdukData.catatan || existingProduk.catatan,
      },
      include: {
        daftar_bahan: true,
        user: {
          include: {
            role: true,
            karyawan: true,
          },
        },
      },
    });

    // Handle stock increment when status is changed to "batal" or "pulih"
    if (updatedStatus === 'batal' || updatedStatus === 'pulih') {
      await prisma.daftar_bahan.update({
        where: {
          id: existingProduk.daftar_bahan.id,
        },
        data: {
          stok: {
            increment: existingProduk.jumlah,
          },
        },
      });
    }


    return {
      success: true,
      message: `Data QC bahan dengan ID ${id} berhasil diperbarui`,
      data: {
        id: updatedProduk.id,
        tanggalTemuan: existingProduk.created_at.toISOString().split('T')[0],
        tanggalSelesai: existingProduk.updated_at.toISOString().split('T')[0],
        idBahan: existingProduk.daftar_bahan.id,
        kodeBahan: existingProduk.qc_produk_id,
        namaBahan: existingProduk.daftar_bahan.nama,
        jumlah: existingProduk.jumlah,
        satuan: existingProduk.daftar_bahan.satuan,
        tindakan: existingProduk.tindakan,
        status: updatedProduk.status,
        catatan: updatedProduk.catatan,
        idPenggunaQc: existingProduk.user.id,
        namaPengguna: existingProduk.user.nama,
        rolePengguna: existingProduk.user.role.nama,
        kontakPengguna: existingProduk.user.karyawan.kontak,
      },
    };
  } catch (error) {
    console.error('Error updating qc_bahan:', error);
    return {
      success: false,
      message: error.message || 'Gagal memperbarui data QC bahan',
    };
  }
};

const deleteQcBahanByIdRepo = async (id) => {
  try {
    const qcBahan = await prisma.qc_bahan.findUnique({
      where: { id: parseInt(id) },
      include: {
        daftar_bahan: true,
        user: true,
      },
    });

    if (!qcBahan) {
      throw new Error('Data QC bahan tidak ditemukan');
    }

    if (qcBahan.status === 'Pulih') {
      throw new Error('Data QC bahan dengan status "Pulih" tidak dapat dihapus');
    }

    await prisma.qc_bahan.delete({
      where: { id: parseInt(id) },
    });

    // If status is "Batal", return stok daftar_bahan
    if (qcBahan.status === 'Batal') {
      await prisma.daftar_bahan.update({
        where: { id: qcBahan.daftar_bahan.id },
        data: {
          stok: {
            increment: qcBahan.jumlah,
          },
        },
      });
    }

    return {
      success: true,
      message: `Data QC bahan dengan ID ${id} berhasil dihapus`,
    };
  } catch (error) {
    console.error('Error deleting qc_bahan:', error);
    return {
      success: false,
      message: error.message || 'Gagal menghapus data QC bahan',
    };
  }
};

module.exports={
  findQcBahan,
  findQcBahanById,
  insertQcBahanRepo,
  updateQcBahanRepo,
  deleteQcBahanByIdRepo
}