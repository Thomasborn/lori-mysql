const prisma = require("../db");
const findDistribusi = async (filters) => {
  try {
    const { q, bulanDistribusi, tahunDistribusi, idAsalOutlet, idTujuanOutlet, itemsPerPage, page } = filters;

    // Prepare filter object
    const where = {};

    // Filter by search query `q` (if provided)
    if (q) {
      where.OR = [
        // { produk_id: { contains: q.toString() } }, // Convert to string if necessary
        { catatan: { contains: q, mode: 'insensitive' } },
        { daftarProduk: { model_produk: { nama: { contains: q, mode: 'insensitive' } } } } // Search by nama in model_produk
      ];
    }

    // Filter by `bulanDistribusi` and `tahunDistribusi` using `created_at`
    if (bulanDistribusi && tahunDistribusi) {
      where.created_at = {
        gte: new Date(`${tahunDistribusi}-${bulanDistribusi}-01`),
        lt: new Date(`${tahunDistribusi}-${parseInt(bulanDistribusi) + 1}-01`)
      };
    }

    // Filter by `idAsalOutlet` (if provided)
    if (idAsalOutlet) {
      where.asal_outlet_id = parseInt(idAsalOutlet);
    }

    // Filter by `idTujuanOutlet` (if provided)
    if (idTujuanOutlet) {
      where.tujuan_outlet_id = parseInt(idTujuanOutlet);
    }

    // Default values for pagination
    const currentPage = parseInt(page) || 1;
    const perPage = parseInt(itemsPerPage) || 10;

    // Calculate the offset for pagination
    const skip = (currentPage - 1) * perPage;

    // Fetch total count of data matching the filters
    const totalData = await prisma.distribusi.count({ where });

    // Fetch paginated data
    const data = await prisma.distribusi.findMany({
      where,
      include: {
        Pic: true,
        daftarProduk: {
          include: {
            model_produk: true, // Include nested relation to get namaProduk
          },
        },
        asalOutlet: true,
        tujuanOutlet: true,
      },
      skip,
      take: perPage,
    });

    // Calculate total pages based on perPage
    const totalPages = Math.ceil(totalData / perPage);

    // Reshape the response
    const reshapedResponse = {
      success: true,
      message: "Data distribusi berhasil diperoleh",
      dataTitle: "Distribusi",
      itemsPerPage: perPage,
      totalPages,
      totalData,
      page: currentPage,
      data: data.map(distribusi => ({
        id: distribusi.id,
        tanggal: distribusi.tanggal.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        idVarian: distribusi.produk_id,
        namaProduk: distribusi.daftarProduk?.model_produk?.nama || 'N/A', // Get nama from model_produk
        ukuranProduk: distribusi.daftarProduk?.ukuran || 'N/A', // Get ukuran from daftarProduk
        jumlah: distribusi.jumlah,
        idAsalOutlet: distribusi.asal_outlet_id,
        namaAsalOutlet: distribusi.asalOutlet?.nama || 'N/A', // Get nama from asalOutlet
        idTujuanOutlet: distribusi.tujuan_outlet_id,
        namaTujuanOutlet: distribusi.tujuanOutlet?.nama || 'N/A', // Get nama from tujuanOutlet
        catatan: distribusi.catatan,
        idPenggunaPic: distribusi.idPic,
        namaPenggunaPic: distribusi.Pic?.namaPenggunaPic || 'N/A', // Get nama from Pic
      })),
    };

    return reshapedResponse;
  } catch (error) {
    throw new Error(`Error fetching distribusi: ${error.message}`);
  }
};

// Find all distribusi
const findAll = async () => {
  return await prisma.distribusi.findMany({
    include: {
      Pic: true,
      daftarProduk: true,
      asalOutlet: true,
      tujuanOutlet: true,
    },
  });
};

const findById = async (id) => {
  try {
    const distribusi = await prisma.distribusi.findUnique({
      where: { id },
      include: {
        Pic: {
          select: {
            karyawan: true,
            role: true,
          },
        },
        daftarProduk: {
          select: {
      
            model_produk: {
              select: {
                kategori: {
                  select: {
                    nama: true,
                  },
                },
              },
            },
          },
        },
        asalOutlet: {
          select: {
            id: true,
            nama: true,
          },
        },
        tujuanOutlet: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    });

    if (!distribusi) {
      return {
        success: false,
        message: `Data distribusi dengan ID ${id} tidak ditemukan`,
      };
    }

    // Create reshaped data object
    const reshapedData = {
      success: true,
      message: `Data distribusi dengan ID ${id} berhasil diperoleh`,
      data: {
        id: distribusi.id,
        tanggal: distribusi.tanggal.toLocaleDateString('en-GB'), // Assuming tanggal is a Date object
        namaProduk: distribusi.daftarProduk.model_produk.nma,
        idVarian: distribusi.idVarian, // Assuming idVarian is a property of distribusi
        ukuranProduk: distribusi.daftarProduk.ukuran, // Assuming ukuranProduk is a property of daftarProduk
        jumlah: distribusi.jumlah,
        idAsalOutlet: distribusi.asalOutlet.id,
        namaAsalOutlet: distribusi.asalOutlet.nama,
        idTujuanOutlet: distribusi.tujuanOutlet.id,
        namaTujuanOutlet: distribusi.tujuanOutlet.nama,
        catatan: distribusi.catatan,
        idPenggunaPic: distribusi.Pic.id,
        namaPenggunaPic: distribusi.Pic.karyawan.nama,
        rolePenggunaPic: distribusi.Pic.role.nama,
        kontakPenggunaPic: distribusi.Pic.karyawan.kontak,
        kategoriProduk: distribusi.daftarProduk.model_produk.kategori.nama,
        kodeProduk: distribusi.daftarProduk.model_produk.kode,
      },
    };

    return reshapedData;
  } catch (error) {
    throw new Error(`Error fetching distribusi dengan ID ${id}: ${error.message}`);
  }
};
const createDistribusi = async (data) => {
  try {
    const { catatan, idAsalOutlet, idPenggunaPic, idTujuanOutlet, idVarian, jumlah, namaAsalOutlet, namaPenggunaPic, namaProduk, namaTujuanOutlet, tanggal, ukuranProduk } = data;

    // Assuming tanggal is in the format "DD/MM/YYYY", parse it to DateTime
    const parsedTanggal = new Date(tanggal.split('/').reverse().join('-'));

    const createdDistribusi = await prisma.distribusi.create({
      data: {
        catatan,
        jumlah: parseInt(jumlah), // Convert jumlah to integer
        tanggal: parsedTanggal,
        asal_outlet_id: parseInt(idAsalOutlet),
        tujuan_outlet_id: parseInt(idTujuanOutlet),
        produk_id: parseInt(idVarian), // Assuming idVarian represents the ID of the variant
        idPic: parseInt(idPenggunaPic), // Assuming idPenggunaPic represents the ID of the user
      },
      include: {
        Pic: true,
        daftarProduk: true,
        asalOutlet: true,
        tujuanOutlet: true,
      },
    });

    // Reshape the response to match the expected format
    const reshapedResponse = {
      success: true,
      message: 'Data distribusi berhasil ditambahkan dengan ID ' + createdDistribusi.id,
      data: {
        id: createdDistribusi.id,
        tanggal: tanggal,
        idVarian: idVarian,
        namaProduk: namaProduk,
        ukuranProduk: ukuranProduk,
        jumlah: jumlah,
        idAsalOutlet: idAsalOutlet,
        namaAsalOutlet: namaAsalOutlet,
        idTujuanOutlet: idTujuanOutlet,
        namaTujuanOutlet: namaTujuanOutlet,
        catatan: catatan,
        idPenggunaPic: idPenggunaPic,
        namaPenggunaPic: namaPenggunaPic
      }
    };

    return reshapedResponse;
  } catch (error) {
    throw new Error(`Failed to create distribusi: ${error.message}`);
  }
};


// Create a new distribusi
const create = async (data) => {
  return await prisma.distribusi.create({ data });
};

// Update distribusi by ID
const update = async (id, data) => {
  return await prisma.distribusi.update({
    where: { id },
    data,
  });
};
//delete distribusi
const deleteDistribusiById = async (id) => {
  try {
    const deletedDistribusi = await prisma.distribusi.delete({
      where: { id },
    });

    if (!deletedDistribusi) {
      throw new Error(`Distribusi dengan ID ${id} tidak ditemukan`);
    }

    return {
      success: true,
      message: `Data distribusi dengan ID ${id} berhasil dihapus`,
      data: deletedDistribusi,
    };
  } catch (error) {
    throw new Error(`Gagal menghapus distribusi: ${error.message}`);
  }
};

module.exports = {
  createDistribusi,
  deleteDistribusiById,
};

// Delete distribusi by ID
const remove = async (id) => {
  return await prisma.distribusi.delete({
    where: { id },
  });
};

module.exports = {
  findDistribusi,
  createDistribusi,
  deleteDistribusiById,
  findAll,
  findById,
  create,
  update,
  remove,
};
