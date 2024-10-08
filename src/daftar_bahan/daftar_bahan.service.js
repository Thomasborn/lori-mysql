const prisma = require("../db");
const { findBahan, findBahanById, insertBahanRepo, updateBahanRepo, deleteBahanByIdRepo } = require("./daftar_bahan.repository");
const getBahan = async (q,kategori, page = 1, itemsPerPage = 10) => {
    // Calculate pagination offsets
    const offset = (page - 1) * itemsPerPage;

    // Fetch materials based on category and pagination parameters
    const daftar_bahan = await findBahan(q,kategori, offset, itemsPerPage);

    return daftar_bahan;

};



const getBahanById = async (id) => {
  const daftar_bahan = await findBahanById(id);

  if (!daftar_bahan) {
    throw Error("Bahan tidak ditemukan");
  }

  return daftar_bahan;
};
const deleteBahanById = async (id) => {
  const bahan= await deleteBahanByIdRepo(id)
 
  return bahan;
};
const insertBahan = async (newBahanData,file)=>{
  const daftar_bahan = await insertBahanRepo(newBahanData,file);

  return daftar_bahan;
  
};
const updatedBahan = async (id,updatedBahanData,file)=>{
  const daftar_bahan = await updateBahanRepo(id,updatedBahanData,file);
  return daftar_bahan;
};
module.exports = {
  getBahan,
  getBahanById,
  insertBahan,
  updatedBahan,
  deleteBahanById
};
