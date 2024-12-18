

const prisma = require("../db");

const {
  insertModelProduk,
  updateModelProduk,
  getModelProdukById
} = require("../model_produk/model_produk.service");
const findDetailModelProdukList = async (q = {}, page = 1, itemsPerPage = 10) => {
  // Fetch detail_model_produk data based on search criteria and pagination parameters
  const detail_model_produk = await prisma.detail_model_produk.findMany({
    where: q,
    include: {
      model_produk: {
        include: {
          kategori: true,
          foto_produk: true
        }
      }
    },
    skip: (page - 1) * itemsPerPage,
    take: itemsPerPage
  });

  // Calculate hargaJualMax and hargaJualMin after fetching the data
  const hargaJuals = detail_model_produk.map(item => item.harga_jual).filter(hargaJual => hargaJual !== null);
  const hargaJualMax = hargaJuals.length > 0 ? Math.max(...hargaJuals) : null;
  const hargaJualMin = hargaJuals.length > 0 ? Math.min(...hargaJuals) : null;

  // Extracting required fields
  const extractedData = detail_model_produk.map(item => ({
    // deskripsi: item.model_produk.deskripsi,
    foto: item.model_produk.foto_produk.map(foto => foto.filepath),
    hargaJualMax,
    hargaJualMin,
    id: item.id,
    kategori: item.model_produk.kategori.nama,
    kode: item.model_produk.kode,
    nama: item.model_produk.nama,
    stok: item.jumlah ?? 0
  }));

  // Fetch total count of detail_model_produk for pagination
  const totalProduk = await prisma.detail_model_produk.count({
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
};
const findDaftarProduk = async (q, kategori, idOutlet, page = 1, itemsPerPage = 10) => {
  try {
    const filters = { q, kategori, idOutlet };
    let whereClause = {};

    if (idOutlet && !isNaN(idOutlet) && idOutlet!=null) {
      // return {
      //   success: false,
      //   message: "Terjadi kesalahan saat mengambil data outlet",
      //   error: idOutlet,
      // };
      whereClause.outlet_id = idOutlet;
    }

    // Skip if `q` is invalid (undefined, null, NaN, or an empty string)
    const lowercaseQ = q.toString().toLowerCase();

    // Debugging: Log filters and initial whereClause
    console.log('Filters:', filters);
    console.log('Initial Where Clause:', whereClause);

    // Search based on `q` for `nama` or `kode` in `model_produk`
    if (q && q.trim() !== '') {

      whereClause = {
        ...whereClause,
        detail_model_produk: {
          ...whereClause.detail_model_produk,
          model_produk: {
            ...(whereClause.detail_model_produk?.model_produk || {}),
            OR: [
              { nama: { contains: lowercaseQ} },  // Using lte, but this may not work as intended
              { kode: { contains: lowercaseQ} },  // Using lte, but this may not work as intended
            ],
          },
        },
      };
    }

    // Filter by `kategori`
    if (kategori && kategori.trim() !== '') {
      // console.log("tesssssssssssssst")
      // return {
      //   success: false,
      //   message: "Terjadi kesalahan saat mengambil data outlet",
      //   error: kategori,
      // };
      whereClause = {
        ...whereClause,
        detail_model_produk: {
          ...whereClause.detail_model_produk,
          model_produk: {
            ...(whereClause.detail_model_produk?.model_produk || {}),
            kategori: { nama: kategori.toString() },
          },
        },
      };
    }

    // Debugging: Log updated whereClause after filtering by q and kategori
    console.log('Updated Where Clause after q and kategori filters:', whereClause);

    // Count total data
    // const totalData = await prisma.produk_outlet.count({
    //   where: whereClause,
      
    // });

  
    // Fetch data
    const produkOutletList = await prisma.produk_outlet.findMany({
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
          },
        },
        outlet: true,
      },
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
    });
    
    const totalData = produkOutletList.length;
    const totalPages = Math.ceil(totalData / itemsPerPage);
    
    // Debugging: Log the total data count
    console.log('Total Data:', totalData);
    console.log('Total Pages:', totalPages);
    
    // Debugging: Log the fetched data
    console.log('Fetched produkOutletList:', produkOutletList);
    
    // Group data by `model_produk.id`
    const groupedData = produkOutletList.reduce((acc, produkOutlet) => {
      const { detail_model_produk } = produkOutlet;
    
      // Ensure `detail_model_produk` exists
      if (!detail_model_produk || !detail_model_produk.model_produk) return acc;
    
      const { model_produk } = detail_model_produk;
    
      if (!acc[model_produk.id]) {
        acc[model_produk.id] = {
          id: model_produk.id,
          nama: model_produk.nama,
          kode: model_produk.kode,
          kategori: model_produk.kategori?.nama || null,
          foto: model_produk.foto_produk?.map((foto) => foto.filepath) || [],
          stok: 0,
          hargaJualMin: Infinity,
          hargaJualMax: -Infinity,
          varian: [],
        };
      }
    
      acc[model_produk.id].stok += produkOutlet.jumlah || 0;
      acc[model_produk.id].hargaJualMin = Math.min(
        acc[model_produk.id].hargaJualMin,
        detail_model_produk.harga_jual || Infinity
      );
      acc[model_produk.id].hargaJualMax = Math.max(
        acc[model_produk.id].hargaJualMax,
        detail_model_produk.harga_jual || -Infinity
      );
    
      acc[model_produk.id].varian.push({
        id: detail_model_produk.id, // Ensure this field exists in your data model
        ukuran: detail_model_produk.ukuran || 'Unknown',
        harga: detail_model_produk.harga_jual || 0,
        stok: produkOutlet.jumlah || 0,
      });
    
      return acc;
    }, {});
    
    console.log('Grouped Data:', groupedData);
    

    // Transform grouped data into an array
    const transformedDataList = Object.values(groupedData);

    return {
      success: true,
      message: "Data produk berhasil diperoleh",
      dataTitle: "Produk",
      itemsPerPage,
      totalPages,
      totalData,
      page: page.toString(),
      data: transformedDataList,
      filters,
      lowercaseQ,
    };
  } catch (error) {
    // Debugging: Log error if it occurs
    console.error('Error occurred:', error.message);
    return {
      success: false,
      message: "Terjadi kesalahan saat mengambil data produk",
      error: error.message,
    };
  }
};
const findDaftarProdukOutlet = async (q, kategori, idOutlet, page = 1, itemsPerPage = 10) => {
  try {
    const filters = { q, kategori, idOutlet };
    let whereClause = {};

    if (idOutlet && !isNaN(idOutlet) && idOutlet!=null) {
      // return {
      //   success: false,
      //   message: "Terjadi kesalahan saat mengambil data outlet",
      //   error: idOutlet,
      // };
      whereClause.outlet_id = idOutlet;
    }

    // Skip if `q` is invalid (undefined, null, NaN, or an empty string)
    const lowercaseQ = q.toString().toLowerCase();

    // Debugging: Log filters and initial whereClause
    console.log('Filters:', filters);
    console.log('Initial Where Clause:', whereClause);

    // Search based on `q` for `nama` or `kode` in `model_produk`
    if (q && q.trim() !== '') {

      whereClause = {
        ...whereClause,
        detail_model_produk: {
          ...whereClause.detail_model_produk,
          model_produk: {
            ...(whereClause.detail_model_produk?.model_produk || {}),
            OR: [
              { nama: { contains: lowercaseQ} },  // Using lte, but this may not work as intended
              { kode: { contains: lowercaseQ} },  // Using lte, but this may not work as intended
            ],
          },
        },
      };
    }

    // Filter by `kategori`
    if (kategori && kategori.trim() !== '') {
      // console.log("tesssssssssssssst")
      // return {
      //   success: false,
      //   message: "Terjadi kesalahan saat mengambil data outlet",
      //   error: kategori,
      // };
      whereClause = {
        ...whereClause,
        detail_model_produk: {
          ...whereClause.detail_model_produk,
          model_produk: {
            ...(whereClause.detail_model_produk?.model_produk || {}),
            kategori: { nama: kategori.toString() },
          },
        },
      };
    }

    // Debugging: Log updated whereClause after filtering by q and kategori
    console.log('Updated Where Clause after q and kategori filters:', whereClause);

    // Count total data
    // const totalData = await prisma.produk_outlet.count({
    //   where: whereClause,
      
    // });

  
    // Fetch data
    const produkOutletList = await prisma.produk_outlet.findMany({
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
          },
        },
        outlet: true,
      },
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
    });
    const totalData = produkOutletList.length;
    const totalPages = Math.ceil(totalData / itemsPerPage);

    // Debugging: Log the total data count
    console.log('Total Data:', totalData);
    console.log('Total Pages:', totalPages);

    // Debugging: Log the fetched data
    console.log('Fetched produkOutletList:', produkOutletList);

    // Group data by `model_produk.id`
    const groupedData = produkOutletList.reduce((acc, produkOutlet) => {
      const { detail_model_produk } = produkOutlet;
      const { model_produk } = detail_model_produk;

      if (!acc[model_produk.id]) {
        acc[model_produk.id] = {
          id: produkOutlet.id,
          nama: model_produk.nama,
          kode: model_produk.kode,
          kategori: model_produk.kategori?.nama || null,
          foto: model_produk.foto_produk.map((foto) => foto.filepath),
          stok: 0,
          hargaJualMin: Infinity,
          hargaJualMax: -Infinity,
          varian: [],
        };
      }

      acc[model_produk.id].stok += produkOutlet.jumlah;
      acc[model_produk.id].hargaJualMin = Math.min(
        acc[model_produk.id].hargaJualMin,
        detail_model_produk.harga_jual
      );
      acc[model_produk.id].hargaJualMax = Math.max(
        acc[model_produk.id].hargaJualMax,
        detail_model_produk.harga_jual
      );

      acc[model_produk.id].varian.push({
        id: detail_model_produk.id,
        ukuran: detail_model_produk.ukuran,
        harga: detail_model_produk.harga_jual,
        stok: produkOutlet.jumlah,
      });

      return acc;
    }, {});

    // Transform grouped data into an array
    const transformedDataList = Object.values(groupedData);

    return {
      success: true,
      message: "Data produk berhasil diperoleh",
      dataTitle: "Produk",
      itemsPerPage,
      totalPages,
      totalData,
      page: page.toString(),
      data: transformedDataList,
      filters,
      lowercaseQ,
    };
  } catch (error) {
    // Debugging: Log error if it occurs
    console.error('Error occurred:', error.message);
    return {
      success: false,
      message: "Terjadi kesalahan saat mengambil data produk",
      error: error.message,
    };
  }
};







const findDaftarProdukById = async (productId) => {
  const product = await prisma.model_produk.findUnique({
    where: {
      id: productId,
    },
    include: {
      foto_produk: true,
      kategori: true,
      detail_model_produk: {
        include: {
          bahan_produk: {
            include: {
              daftar_bahan: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    return {
      success: false,
      message: `Product with ID ${productId} not found`,
      data: null,
    };
  }

  // Calculate stok, hargaJualMin, and hargaJualMax based on detail_model_produk
  let stok = 0;
  let hargaJualMin = Infinity;
  let hargaJualMax = -Infinity;

  product.detail_model_produk.forEach((detail) => {
    stok += detail.jumlah || 0;
    if (detail.harga_jual < hargaJualMin) hargaJualMin = detail.harga_jual;
    if (detail.harga_jual > hargaJualMax) hargaJualMax = detail.harga_jual;
  });

  // Map the product data to the desired format
  const mappedProduct = {
    stok,
    hargaJualMin,
    hargaJualMax,
    id: product.id,
    kode: product.kode,
    nama: product.nama,
    kategori: product.kategori.nama,
    foto: product.foto_produk?.filepath || null,
    deskripsi: product.deskripsi || null,
    varian: product.detail_model_produk.map((detail) => {
      let totalBiayaBahan = 0;

      const bahanBiaya = detail.bahan_produk.map((bahan) => {
        const biayaBahan = bahan.jumlah * bahan.daftar_bahan.harga;
        totalBiayaBahan += biayaBahan;

        return {
          id: bahan.daftar_bahan.id,
          nama: bahan.daftar_bahan.nama,
          kategori: bahan.daftar_bahan.kategori,
          kode: bahan.daftar_bahan.kode,
          harga: bahan.daftar_bahan.harga,
          jumlahPakai: bahan.jumlah,
          satuan: bahan.daftar_bahan.satuan,
          biayaBahan: biayaBahan,
        };
      });

      return {
        id: detail.id, // Tambahkan idVarian
        ukuran: detail.ukuran,
        biayaJahit: detail.biaya_jahit,
        hargaJual: detail.harga_jual,
        stok: detail.jumlah || 0,
        bahan: bahanBiaya,
        totalBiayaBahan: totalBiayaBahan,
        hpp: detail.hpp,
      };
    }),
  };

  return {
    success: true,
    message: `Data produk dengan ID ${productId} berhasil diperoleh`,
    data: mappedProduct,
  };
};




const findDaftarProdukByIdOld = async (productId) => {
  try {
    const produkOutlet = await prisma.produk_outlet.findFirst({
      where: {
        produk_id: productId,
        // outlet_id: outletId,
      },
      include: {
        detail_model_produk: {
          include: {
            model_produk: {
              include: {
                kategori: true,
                foto_produk: true,
              },
            },
          },
        },
        outlet: true,
      },
    });

    if (!produkOutlet) {
      return {
        success: false,
        message: "Produk tidak ditemukan untuk outlet yang ditentukan",
      };
    }

    const { detail_model_produk, outlet } = produkOutlet;
    const { model_produk } = detail_model_produk;

    const varian = {
      ukuran: detail_model_produk.ukuran,
      harga: detail_model_produk.harga_jual,
      stok: produkOutlet.jumlah,
    };

    const stok = varian.stok;
    const hargaJualMin = varian.harga;
    const hargaJualMax = varian.harga;

    const transformedData = {
      stok,
      hargaJualMin,
      hargaJualMax,
      id: model_produk.id,
      nama: model_produk.nama,
      kode: model_produk.kode,
      kategori: model_produk.kategori.nama,
      foto: model_produk.foto_produk.map(foto => foto.filepath),
      varian: [varian],
    };

    return {
      success: true,
      message: "Data produk berhasil diperoleh",
      dataTitle: "Produk",
      data: transformedData,
    };
  } catch (error) {
    return {
      success: false,
      message: "Terjadi kesalahan saat mengambil data produk",
      error: error.message,
    };
  }
};

  
  
  
const findDaftarProdukBySku = async (sku) => {
  const daftar_produk = await prisma.daftar_produk.findUnique({
    where: {
      sku:sku,
    },
  });
  
  return daftar_produk;
};

const getModelProdukByKode = async (nama) => {
  return await prisma.model_produk.findFirst({
    where: {
      kode: nama,
    },
  });
};

const insertDaftarProdukRepo = async (data) => {
  // Check if model_produk with the given nama exists
  const existingModel = await getModelProdukByKode(data.nama);

  if (existingModel) {
    // If model_produk exists, return a message indicating the product already exists
    return {
      success: false,
      message: `Produk dengan kode ${existingModel.nama} sudah ada.`,
      data: existingModel
    };
  } else {
    // If model_produk doesn't exist, insert a new one
    const insert_model = await insertModelProduk(data);
// Insert multiple produk_outlet records using createMany
const newProdukOutlets = await prisma.produk_outlet.createMany({
  data: insert_model.createdVarian.map(variant => ({
    produk_id: variant.createdVariant.id, // Replace with the actual product ID
    outlet_id: 11,                        // Replace with the actual outlet ID if necessary
    jumlah: parseInt(data.varian.find(v => v.ukuran === variant.createdVariant.ukuran).stok, 10), // Get the correct stock quantity based on ukuran
  })),
});
    // Shape the response data to match the desired structure
    const responseData = {
      id: insert_model.model_produk.id,
      kode: insert_model.model_produk.kode,
      nama: insert_model.model_produk.nama,
      kategori: data.kategori,
      foto: insert_model.createdPhotos,
      deskripsi: insert_model.model_produk.deskripsi,
      varian: insert_model.createdVarian.map(variant => ({
        ukuran: variant.createdVariant.ukuran,
        biayaJahit: variant.createdVariant.biaya_jahit,
        hargaJual: variant.createdVariant.harga_jual,
        stok: data.varian.find(v => v.ukuran === variant.createdVariant.ukuran).stok,
        bahan: variant.createdBahan.map(bahan => ({
          id: bahan.daftar_bahan_id,
          jumlahPakai: bahan.jumlah
        }))
      }))
    };

    return {
      success: true,
      message: `Data produk berhasil ditambahkan dengan ID ${responseData.id}`,
      data: responseData,newProdukOutlets
    };
  }
};
const reshapeData = (data) => {
  const varian = data.detail_model_produk.map(variant => ({
    ukuran: variant.ukuran,
    biayaJahit: variant.biaya_jahit,
    hargaJual: variant.harga_jual,
    stok: variant.jumlah,
    bahan: Array.isArray(variant.bahan_produk) ? variant.bahan_produk.map(bahan => ({
      id: bahan.daftar_bahan_id,
      jumlahPakai: bahan.jumlah,
    })) : [],
  }));

  return {
    id: data.id,
    kode: data.kode,
    nama: data.nama,
    kategori: data.kategori ? data.kategori.nama : null,
    foto: data.foto_produk ? data.foto_produk.map(photo => photo.filepath) : null,
    deskripsi: data.deskripsi,
    varian: varian,
  };
};

const updateDaftarProdukRepo = async (id, data) => {
  try {
    const existing_produk = await findDaftarProdukById(id);
    if(existing_produk.success==false){
      return {
        success: false,
        message: `Produk dengan ID: ${id} tidak ada di outlet manapun`,
        data: null
      };
    }
    // Update the model_produk with the new data

    const result = await updateModelProduk(existing_produk.data.id, data);

    // Check if the update was successful
    if (!result.updatedModelProduk) {
      return {
        success: false,
        message: `Gagal memperbarui produk dengan ID ${id}`,
        data: null
      };
    }

    // Reshape the updatedModelProduk data
    const reshapedData = reshapeData(result.updatedModelProduk);

    return {
      success: true,
      message: `Data produk dengan ID ${id} berhasil diperbarui`,
      data: reshapedData
    };
  } catch (error) {
    console.error(error);
    throw new Error('Gagal memperbarui produk');
  }
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

const updateDaftarProdukRepoOld = async (id,updatedProdukData) => {
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
    // Find the model_produk
    const modelProduk = await prisma.model_produk.findUnique({
      where: { id },
      include: {
        detail_model_produk: {
          include: {
            bahan_produk: true,
          }
        },
        foto_produk: true,
      },
    });

    if (!modelProduk) {
      return {
        success: false,
        message: 'Produk tidak ditemukan.',
      };
    }

    // Delete bahan_produk related to detail_model_produk
    for (const detail of modelProduk.detail_model_produk) {
      await prisma.bahan_produk.deleteMany({
        where: { detail_model_produk_id: detail.id },
      });

      // Delete detail_model_produk
      await prisma.detail_model_produk.delete({
        where: { id: detail.id },
      });
    }

    // Delete foto_produk related to model_produk
    await prisma.foto_produk.deleteMany({
      where: { model_produk_id: modelProduk.id },
    });

    // Delete model_produk itself
    await prisma.model_produk.delete({
      where: { id },
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
  findDaftarProdukOutlet,
  findDaftarProdukById,
  findDaftarProdukBySku,
  insertDaftarProdukRepo,
  updateDaftarProdukRepo,
  deleteDaftarProdukByIdRepo
}