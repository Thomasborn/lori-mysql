const prisma = require("../db");
const { findRak, findRakById, insertRakRepo, updateRakRepo, deleteRakByIdRepo } = require("./rak.repository");

const getRak = async (q, page = 1, itemsPerPage = 10) => {
    // Call findRak function with pagination parameters
    const rak = await findRak(q, page, itemsPerPage);

    return rak;
};

const getRakById = async (id) => {
  const rak = await findRakById(id);

  if (!rak) {
    return "Tidak ada rak dengan id: " + id;
  }

  return rak;
};

const deleteRakById = async (id) => {
  // await getRakById(id);
  const rak = await deleteRakByIdRepo(id);
 
  return rak;
};

const insertRak = async (newRakData) => {
  const rak = await insertRakRepo(newRakData);

  return rak;
};

const updatedRak = async (id, updatedRakData) => {
  const rak = await updateRakRepo(id, updatedRakData);
  return rak;
};

module.exports = {
  getRak,
  getRakById,
  insertRak,
  updatedRak,
  deleteRakById
};
