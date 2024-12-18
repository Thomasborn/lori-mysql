
const prisma = require("../db");
const findLemari = async (q, page = 1, itemsPerPage = 10) => {
  try {
    // Ensure page is at least 1
    page = Math.max(page, 1);

    // Calculate pagination offset
    const offset = (page - 1) * itemsPerPage;

    // Construct search criteria
    const whereClause = q 
      ? { kode: { contains: q } } 
      : {};

    // Fetch count of lemari data based on search criteria
    const totalLemari = await prisma.lemari.count({
      where: whereClause,
    });

    // Fetch lemari data with outlet information based on pagination parameters and search criteria
    const lemariWithOutlet = await prisma.lemari.findMany({
      include: {
        outlet: true,
      },
      where: whereClause,
      skip: offset,
      take: itemsPerPage,
    });

    // Reshape the data
    const reshapedLemari = lemariWithOutlet.map(lemari => ({
      id: lemari.id,
      kode: lemari.kode,
      kapasitas: lemari.kapasitas,
      idOutlet: lemari.outlet_id,
      outlet: lemari.outlet ? lemari.outlet.nama : null,
      deskripsi: lemari.deskripsi,
    }));

    return {
      success: true,
      message: "Data Rak berhasil diperoleh",
      dataTitle: "Rak",
      itemsPerPage: itemsPerPage,
      totalPages: Math.ceil(totalLemari / itemsPerPage),
      totalData: totalLemari,
      page: page,
      data: reshapedLemari,
      search: q ? { kode: q } : {} // Return search criteria for kode if q is provided
    };

  } catch (error) {
    console.error("Error fetching lemari:", error);
    throw new Error("Error fetching lemari");
  }
};




const findLemariById = async (id) => {
  // Fetch the lemari entry by ID, including related outlet data
  const lemariWithOutlet = await prisma.lemari.findUnique({
    where: {
      id,
    },
    include: {
      outlet: true,
    },
  });

  if (!lemariWithOutlet) {
    // Handle case where the cabinet with the specified ID is not found
    return {
      success: false,
      message: `Data Rak dengan ID ${id} tidak ditemukan.`,
    };
  }

  // Reshape the data
  const reshapedLemari = {
    id: lemariWithOutlet.id,
    kode: lemariWithOutlet.kode,
    kapasitas: lemariWithOutlet.kapasitas,
    idOutlet: lemariWithOutlet.outlet_id,
    outlet: lemariWithOutlet.outlet.nama, // Assuming the outlet model has a 'nama' field
    kodeOutlet: lemariWithOutlet.outlet.kode ?? null, // Assuming the outlet model has a 'kode' field
  };

  return {
    success: true,
    message: `Data rak dengan ID ${id} berhasil ditemukan.`,
    data: reshapedLemari,
  };
};

const insertLemariRepo = async (newLemariData) => {
  const { kode, kapasitas,alamat, stok, jumlah_barang, idOutlet } = newLemariData;
  try {
    const lemari = await prisma.lemari.create({
      data: {
        kode: kode || null, // Menggunakan nilai default jika kode kosong
        alamat: " null", // Menggunakan nilai default jika alamat kosong
        kapasitas: kapasitas ? parseInt(kapasitas, 10) : null,
        // stok: stok || 0, // Menggunakan nilai default 0 jika stok kosong
        // jumlah_barang: jumlah_barang || 0, // Menggunakan nilai default 0 jika jumlah_barang kosong
        outlet: {
          connect: {
            id: idOutlet,
          },
        },
      },
    });
    const reshapedLemari = {
      id: lemari.id,
      kode: lemari.kode,
      kapasitas: lemari.kapasitas,
      deskripsi: lemari.deskripsi,
      idOutlet: lemari.outlet_id,
    };
    return {
      success: true,
      message: `Data rak berhasil ditambahkan dengan ID ${lemari.id}`,
      data: reshapedLemari,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Terjadi kesalahan saat menambahkan data rak.',
      error:error
    };
  }
};
const updateLemariRepo = async (id, updatedLemariData) => {
  const { kode, kapasitas, stok, jumlah_barang, idOutlet } = updatedLemariData;

  try {
    // Check if the lemari exists
    const existingLemari = await prisma.lemari.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!existingLemari) {
      return {
        success: false,
        message: `Data rak dengan ID ${id} tidak ditemukan.`,
      };
    }

    // Update the lemari
    const updatedLemari = await prisma.lemari.update({
      where: {
        id: parseInt(id),
      },
      data: {
        kode,
        kapasitas:parseInt(kapasitas),
        stok,
        // jumlah_barang,
        outlet: {
          connect: {
            id: idOutlet,
          },
        },
      },
    });
    const reshapedLemari = {
      id: updatedLemari.id,
      kode: updatedLemari.kode,
      kapasitas: updatedLemari.kapasitas,
      deskripsi: updatedLemari.deskripsi,
      idOutlet: updatedLemari.outlet_id,
    };
    return {
      success: true,
      message: `Data rak dengan ID ${id} berhasil diperbarui.`,
      data: reshapedLemari,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Terjadi kesalahan saat memperbarui data rak.',
    };
  }
};
const deleteLemariByIdRepo = async (id) => {
  try {
    // Check if the lemari exists
    const existingLemari = await findLemariById(id);

    if (existingLemari.success==false) {
      return {
        success: false,
        message: `Data rak dengan ID ${id} tidak ditemukan.`,
      };
    }

    // Delete the lemari entry from the database
    await prisma.lemari.delete({
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
module.exports={
  findLemari,
  findLemariById,
  insertLemariRepo,
  updateLemariRepo,
  deleteLemariByIdRepo
}