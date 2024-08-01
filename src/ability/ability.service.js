const prisma = require("../db");
const {  deleteaksesByIdRepo } = require("./ability.repository");
const deleteaksesById = async (id) => {
  await deleteaksesByIdRepo(id)
 
};


module.exports = {

  deleteaksesById
};
