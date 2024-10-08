
const prisma = require("../db");

const {
  insertModelProduk
} = require("../model_produk/model_produk.service");
const findDaftarProdukList = async (q = {}, page = 1, itemsPerPage = 10) => {
    // Fetch daftar_produk data based on search criteria and pagination parameters
    const daftar_produk = await prisma.daftar_produk.findMany({
      where: q,
      include: {
        detail_model_produk: {
          include: {
            model_produk: {
              include: {
                kategori: true,
                foto_produk: true
              }
            }
          }
        }
      },
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage
    });

    // Calculate hargaJualMax and hargaJualMin after fetching the data
    const hargaJuals = daftar_produk.map(item => item.detail_model_produk.harga_jual).filter(hargaJual => hargaJual !== null);
    const hargaJualMax = hargaJuals.length > 0 ? Math.max(...hargaJuals) : null;
    const hargaJualMin = hargaJuals.length > 0 ? Math.min(...hargaJuals) : null;

    // Extracting required fields
    const extractedData = daftar_produk.map(item => ({
      // deskripsi: item.detail_model_produk.model_produk.deskripsi,
      foto: item.detail_model_produk.model_produk.foto_produk.map(foto => foto.filepath),
      hargaJualMax,
      hargaJualMin,
      id: item.id,
      kategori: item.detail_model_produk.model_produk.kategori.nama,
      kode: item.sku,
      nama: item.detail_model_produk.model_produk.nama,
      stok: item.jumlah ?? 0
    }));

    // Fetch total count of daftar_produk for pagination
    const totalProduk = await prisma.daftar_produk.count({
      where: q
    });

    const totalPages = Math.ceil(totalProduk / itemsPerPage);

    return {
      success: true,
      message: "Data Produk berhasil diperoleh",
      dataTitle: "Produk",
      itemsPerPage: itemsPerPage,
      totalPages: totalPages,
      totalData: totalProduk,
      page: page,
      data: extractedData
    };
    

 
};const findDaftarProduk = async (q, kategori, page = 1, itemsPerPage = 10) => {
  let whereClause = {};

  if (q) {
    whereClause = {
      ...whereClause,
      detail_model_produk: {
        model_produk: {
          OR: [
            {
              nama: {
                contains: q,
                lte: 'insensitive',
              },
            },
            {
              kode: {
                contains: q,
                lte: 'insensitive',
              },
            },
          ],
        },
      },
    };
  }

  if (kategori) {
    whereClause = {
      ...whereClause,
      detail_model_produk: {
        model_produk: {
          kategori: {
            nama: kategori,
          },
        },
      },
    };
  }

  const daftar_produk_list = await prisma.daftar_produk.findMany({
    where: whereClause,
    include: {
      detail_model_produk: {
        include: {
          model_produk: {
            include: {
              kategori: true,
              foto_produk: true,
            },
          },
          bahan_produk: {
            include: {
              daftar_bahan: true,
            },
          },
        },
      },
    },
    skip: (page - 1) * itemsPerPage,
    take: itemsPerPage,
  });

  if (daftar_produk_list.length === 0) {
    return {
      success: false,
      message: "Tidak ada produk yang ditemukan",
    };
  }

  const transformedDataList = daftar_produk_list.map(daftar_produk => {
    const transformedData = {
      id: daftar_produk.id,
      nama: daftar_produk.detail_model_produk.model_produk.nama_produk,
      kode: daftar_produk.detail_model_produk.model_produk.kode,
      kategori: daftar_produk.detail_model_produk.model_produk.kategori.nama,
      foto: daftar_produk.detail_model_produk.model_produk.foto_produk.map(foto => foto.url),
      deskripsi: daftar_produk.detail_model_produk.model_produk.deskripsi,
      varian: [
        {
          ukuran: daftar_produk.detail_model_produk.ukuran,
          stok: daftar_produk.detail_model_produk.jumlah ?? 0,
          biayaJahit: daftar_produk.detail_model_produk.biaya_jahit,
          hpp: daftar_produk.detail_model_produk.hpp,
          hargaJual: daftar_produk.detail_model_produk.harga_jual,
          bahan: daftar_produk.detail_model_produk.bahan_produk.map(bahan => ({
            id: bahan.daftar_bahan.id,
            nama: bahan.daftar_bahan.nama,
            kode: bahan.daftar_bahan.kode,
            harga: bahan.daftar_bahan.harga,
            jumlahPakai: bahan.jumlah,
            satuan: bahan.daftar_bahan.satuan,
            biayaBahan: bahan.jumlah * bahan.daftar_bahan.harga
          })),
          totalBiayaBahan: daftar_produk.detail_model_produk.bahan_produk.reduce((total, bahan) => total + (bahan.jumlah * bahan.daftar_bahan.harga), 0)
        }
      ]
    };

    const stok = transformedData.varian.reduce((totalStok, variant) => totalStok + variant.stok, 0);
    const hargaJualMin = transformedData.varian.length > 0 ? Math.min(...transformedData.varian.map(variant => variant.hargaJual)) : 0;
    const hargaJualMax = transformedData.varian.length > 0 ? Math.max(...transformedData.varian.map(variant => variant.hargaJual)) : 0;

    transformedData.stok = stok;
    transformedData.hargaJualMin = hargaJualMin;
    transformedData.hargaJualMax = hargaJualMax;

    return transformedData;
  });

  return {
    success: true,
    message: "Data produk berhasil diperoleh",
    data: transformedDataList
  };
};

  const findDaftarProdukById = async (id) => {
    const daftar_produk = await prisma.daftar_produk.findUnique({
      where: {
        id,
      },
      include: {
        detail_model_produk: {
          include: {
            model_produk: {
              include: {
                kategori: true,
                foto_produk: true
              }
            },
            bahan_produk: {
              include: {
                daftar_bahan: true
              }
            }
          }
        }
      }
    });
    if (!daftar_produk) {
      return {
        success: false,
        message: "Daftar produk dengan ID: "+id+" tidak ditemukan",
      };
    }
    // Transform the data
    const transformedData = {
      id: daftar_produk.id,
      nama: daftar_produk.sku, // Assuming 'sku' is the name of the product
      kode: daftar_produk.detail_model_produk.model_produk.kode,
      kategori: daftar_produk.detail_model_produk.model_produk.kategori.nama,
      foto: daftar_produk.detail_model_produk.model_produk.foto_produk, // Assuming 'foto_produk' is an array of photos
      deskripsi: daftar_produk.detail_model_produk.model_produk.deskripsi,
      varian: [
        {
          ukuran: daftar_produk.detail_model_produk.ukuran,
          stok: daftar_produk.detail_model_produk.jumlah??0, // Assuming 'jumlah' is the stock quantity
          biayaJahit: daftar_produk.detail_model_produk.biaya_jahit,
          hpp: daftar_produk.detail_model_produk.hpp,
          hargaJual: daftar_produk.detail_model_produk.harga_jual,
          bahan: daftar_produk.detail_model_produk.bahan_produk.map(bahan => ({
            id: bahan.daftar_bahan.id,
            nama: bahan.daftar_bahan.nama,
            kode: bahan.daftar_bahan.kode,
            harga: bahan.daftar_bahan.harga,
            jumlahPakai: bahan.jumlah, // Assuming 'jumlah' is the quantity used
            satuan: bahan.daftar_bahan.satuan,
            biayaBahan: bahan.jumlah * bahan.daftar_bahan.harga // Assuming 'jumlah' is the quantity used
          })),
          totalBiayaBahan: daftar_produk.detail_model_produk.bahan_produk.reduce((total, bahan) => total + (bahan.jumlah * bahan.daftar_bahan.harga), 0) // Total cost of all materials
        }
      ]
    };
  
    // Additional calculations
    const stok = transformedData.varian.reduce((totalStok, variant) => totalStok + variant.stok, 0);
    const hargaJualMin = transformedData.varian.length > 0 ? Math.min(...transformedData.varian.map(variant => variant.hargaJual)) : 0;
    const hargaJualMax = transformedData.varian.length > 0 ? Math.max(...transformedData.varian.map(variant => variant.hargaJual)) : 0;
  
    // Add additional properties to the transformed data
    transformedData.stok = stok;
    transformedData.hargaJualMin = hargaJualMin;
    transformedData.hargaJualMax = hargaJualMax;
  
    return {
      success: true,
      message: `Data produk dengan id ${transformedData.id} berhasil diperoleh`,
      data: transformedData
    };
  }
  
  
  
const findDaftarProdukBySku = async (sku) => {
  const daftar_produk = await prisma.daftar_produk.findUnique({
    where: {
      sku:sku,
    },
  });
  
  return daftar_produk;
};
const insertDaftarProdukRepo = async (data) => {
    // Insert model_produk and detail_model_produk
    const insert_model = await insertModelProduk(data);

    // Generate SKU based on detail model and model
    const sku = `${insert_model.model_produk.kode}-${insert_model.detail_model_produk.ukuran}`;

    // Insert the product into the database
    const daftar_produk = await prisma.daftar_produk.create({
      data: {
        sku,
        detail_model_produk: {
          connect: {
            id: insert_model.detail_model_produk.id,
          },
        },
      },
    });

    // Fetch the inserted data along with related information
    const insertedData = await prisma.daftar_produk.findUnique({
      where: { id: daftar_produk.id },
      include: {
        detail_model_produk: {
          include: {
            model_produk: {
              include: {
                kategori: true,
                foto_produk: true,
              },
            },
            bahan_produk: {
              include: {
                daftar_bahan: true,
              },
            },
          },
        },
      },
    });

    // Format the response
    const response = {
      
        id: insertedData.id,
        kode: insertedData.detail_model_produk.model_produk.kode,
        nama: insertedData.detail_model_produk.model_produk.nama,
        kategori: insertedData.detail_model_produk.model_produk.kategori.nama,
        foto: insertedData.detail_model_produk.model_produk.foto_produk.map(foto => foto.filepath),
        deskripsi: insertedData.detail_model_produk.model_produk.deskripsi,
        varian: [
          {
            ukuran: insertedData.detail_model_produk.ukuran,
            biayaJahit: insertedData.detail_model_produk.biaya_jahit,
            hargaJual: insertedData.detail_model_produk.harga_jual,
            stok: insertedData.detail_model_produk.jumlah,
            bahan: insertedData.detail_model_produk.bahan_produk.map(bahan => ({
              id: bahan.daftar_bahan.id,
              jumlahPakai: bahan.jumlah,
            })),
          },
        ],

    };

    return {
      success: true,
      message: `Data produk berhasil ditambahkan dengan ID ${response.id}`,
      data: response
  };
  
 
};
// const insertDaftarProdukRepo = async (data) => {
//   const { sku, detail_model_produk_id } = data;

//   // Insert the product into the database
//   const daftar_produk = await prisma.daftar_produk.create({
//     data: {
//       sku,
//       detail_model_produk: {
//         connect: {
//           id: parseInt(detail_model_produk_id),
//         },
//       },
//     },
//   });

//   // Fetch the inserted data along with related information
//   const insertedData = await findDaftarProdukById(daftar_produk.id);

//   // Format the fetched data according to the specified structure
//   const formattedData = {
//     success: true,
//     message: `Data produk berhasil ditambahkan dengan ID ${insertedData.id}`,
//     data: {
//       id: insertedData.id,
//       kode: insertedData.kode,
//       nama: insertedData.nama,
//       kategori: insertedData.kategori,
//       foto: insertedData.foto,
//       deskripsi: insertedData.deskripsi,
//       varian: insertedData.varian.map(variant => ({
//         ukuran: variant.ukuran,
//         biayaJahit: variant.biayaJahit,
//         hargaJual: variant.hargaJual,
//         stok: variant.stok,
//         bahan: variant.bahan.map(bahan => ({
//           id: bahan.id,
//           jumlahPakai: bahan.jumlahPakai,
//         })),
//       })),
//     },
//   };

//   return formattedData;
// };

const updateDaftarProdukRepo = async (id,updatedProdukData) => {
  const daftarProduk = await prisma.daftar_produk.findUnique({
    where: { id },
    include: {
      detail_model_produk: {
        include: {
          model_produk: true,
        }
      }
    },
  });

  if (!daftarProduk) {
    return {
      success: false,
      message: 'Produk tidak ditemukan.',
    };
  }


  // Delete bahan_produk related to detail_model_produk
  await prisma.bahan_produk.deleteMany({
    where: { detail_model_produk_id: daftarProduk.detail_model_produk.id },
  });
  // Delete daftar_produk itself
  // await prisma.daftar_produk.delete({
  //   where: { id },
  // });
 
  // Delete detail_model_produk
  await prisma.detail_model_produk.delete({
    where: { id: daftarProduk.detail_model_produk.id },
  });

// Delete foto_produk related to model_produk
  await prisma.foto_produk.deleteMany({
    where: { model_produk_id: daftarProduk.detail_model_produk.model_produk.id },
  });
  // Delete model_produk
  await prisma.model_produk.delete({
    where: { id: daftarProduk.detail_model_produk.model_produk.id },
  });

      // Validate and update the daftar_produk data
      const updatedProduk = await prisma.daftar_produk.update({
      where: { id: parseInt(id) },
      data: {
          // Add validation and update fields as needed
          kategori: updatedProdukData.kategori || existingProduk.kategori.kategori
        
      },
      });
      return updatedProduk
}
const deleteDaftarProdukByIdRepo = async (id) => {
  try {
    // Find the daftar_produk
    const daftarProduk = await prisma.daftar_produk.findUnique({
      where: { id },
      include: {
        detail_model_produk: {
          include: {
            model_produk: true,
          }
        }
      },
    });

    if (!daftarProduk) {
      return {
        success: false,
        message: 'Produk tidak ditemukan.',
      };
    }


    // Delete bahan_produk related to detail_model_produk
    await prisma.bahan_produk.deleteMany({
      where: { detail_model_produk_id: daftarProduk.detail_model_produk.id },
    });
    // Delete daftar_produk itself
    await prisma.daftar_produk.delete({
      where: { id },
    });
   
    // Delete detail_model_produk
    await prisma.detail_model_produk.delete({
      where: { id: daftarProduk.detail_model_produk.id },
    });

// Delete foto_produk related to model_produk
    await prisma.foto_produk.deleteMany({
      where: { model_produk_id: daftarProduk.detail_model_produk.model_produk.id },
    });
    // Delete model_produk
    await prisma.model_produk.delete({
      where: { id: daftarProduk.detail_model_produk.model_produk.id },
    });

    

    return {
      success: true,
      message: `Produk dengan ID ${id} berhasil dihapus.`,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Gagal menghapus daftar produk.',
      error: error.message || 'Sedang terjadi kesalahan di server, silahkan coba beberapa saat lagi',
    };
  }
};




module.exports={
  findDaftarProduk,
  findDaftarProdukById,
  findDaftarProdukBySku,
  insertDaftarProdukRepo,
  updateDaftarProdukRepo,
  deleteDaftarProdukByIdRepo
}