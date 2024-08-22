const prisma = require("../db");

const findRak = async (q, page = 1, itemsPerPage = 10) => {
  try {
    // Ensure page is at least 1
    page = Math.max(page, 1);

    // Calculate pagination offset
    const offset = (page - 1) * itemsPerPage;

    // Construct search criteria
    let whereClause = {};
    if (q) {
      whereClause = {
        kode: { contains: q.toString(), lte: 'insensitive' }
      };
    }

    // Fetch count of rak data based on search criteria
    const totalRak = await prisma.rak.count({
      where: whereClause,
    });

    // Fetch rak data with outlet information based on pagination parameters and search criteria
    const rakWithOutlet = await prisma.rak.findMany({
      include: {
        outlet: true,
      },
      where: whereClause,
      skip: offset,
      take: itemsPerPage,
    });

    // Reshape the data
    const reshapedRak = rakWithOutlet.map(rak => ({
      id: rak.id,
      kode: rak.kode,
      kapasitas: rak.kapasitas,
      idOutlet: rak.outlet_id,
      outlet: rak.outlet ? rak.outlet.nama : null,
      deskripsi: rak.deskripsi,
    }));

    return {
      success: true,
      message: "Data Rak berhasil diperoleh",
      dataTitle: "Rak",
      itemsPerPage: itemsPerPage,
      totalPages: Math.ceil(totalRak / itemsPerPage),
      totalData: totalRak,
      page: page,
      data: reshapedRak,
      search: q ? { kode: q } : {} // Return search criteria for kode if q is provided
    };

  } catch (error) {
    console.error("Error fetching rak:", error);
    throw new Error("Error fetching rak");
  }
};

const findRakById = async (id) => {
  // Fetch the rak entry by ID, including related outlet data
  const rakWithOutlet = await prisma.rak.findUnique({
    where: {
      id,
    },
    include: {
      outlet: true,
    },
  });

  if (!rakWithOutlet) {
    // Handle case where the rak with the specified ID is not found
    return {
      success: false,
      message: `Data Rak dengan ID ${id} tidak ditemukan.`,
    };
  }

  // Reshape the data
  const reshapedRak = {
    id: rakWithOutlet.id,
    kode: rakWithOutlet.kode,
    kapasitas: rakWithOutlet.kapasitas,
    idOutlet: rakWithOutlet.outlet_id,
    outlet: rakWithOutlet.outlet.nama, // Assuming the outlet model has a 'nama' field
    kodeOutlet: rakWithOutlet.outlet.kode ?? null, // Assuming the outlet model has a 'kode' field
  };

  return {
    success: true,
    message: `Data rak dengan ID ${id} berhasil ditemukan.`,
    data: reshapedRak,
  };
};

const insertRakRepo = async (newRakData) => {
  const { kode, kapasitas, alamat, stok, jumlah_barang, idOutlet } = newRakData;
  try {
    const rak = await prisma.rak.create({
      data: {
        kode: kode || null, // Menggunakan nilai default jika kode kosong
        alamat: alamat || null, // Menggunakan nilai default jika alamat kosong
        kapasitas: kapasitas || null, // Menggunakan nilai default jika kapasitas kosong
        // stok: stok || 0, // Menggunakan nilai default 0 jika stok kosong
        // jumlah_barang: jumlah_barang || 0, // Menggunakan nilai default 0 jika jumlah_barang kosong
        outlet: {
          connect: {
            id: idOutlet,
          },
        },
      },
    });
    const reshapedRak = {
      id: rak.id,
      kode: rak.kode,
      kapasitas: rak.kapasitas,
      deskripsi: rak.deskripsi,
      idOutlet: rak.outlet_id,
    };
    return {
      success: true,
      message: `Data rak berhasil ditambahkan dengan ID ${rak.id}`,
      data: reshapedRak,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Terjadi kesalahan saat menambahkan data rak.',
    };
  }
};

const updateRakRepo = async (id, updatedRakData) => {
  const { kode, kapasitas, stok, jumlah_barang, idOutlet } = updatedRakData;

  try {
    // Check if the rak exists
    const existingRak = await prisma.rak.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!existingRak) {
      return {
        success: false,
        message: `Data rak dengan ID ${id} tidak ditemukan.`,
      };
    }

    // Update the rak
    const updatedRak = await prisma.rak.update({
      where: {
        id: parseInt(id),
      },
      data: {
        kode,
        kapasitas,
        stok,
        // jumlah_barang,
        outlet: {
          connect: {
            id: idOutlet,
          },
        },
      },
    });
    const reshapedRak = {
      id: updatedRak.id,
      kode: updatedRak.kode,
      kapasitas: updatedRak.kapasitas,
      deskripsi: updatedRak.deskripsi,
      idOutlet: updatedRak.outlet_id,
    };
    return {
      success: true,
      message: `Data rak dengan ID ${id} berhasil diperbarui.`,
      data: reshapedRak,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Terjadi kesalahan saat memperbarui data rak.',
    };
  }
};

const deleteRakByIdRepo = async (id) => {
  try {
    // Check if the rak exists
    const existingRak = await findRakById(id);

    if (existingRak.success == false) {
      return {
        success: false,
        message: `Data rak dengan ID ${id} tidak ditemukan.`,
      };
    }

    // Delete the rak entry from the database
    await prisma.rak.delete({
      where: { id: id },
    });

    return {
      success: true,
      message: `Data rak dengan ID ${id} berhasil dihapus.`,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Terjadi kesalahan saat menghapus data rak.',
    };
  }
};

module.exports = {
  findRak,
  findRakById,
  insertRakRepo,
  updateRakRepo,
  deleteRakByIdRepo
};
