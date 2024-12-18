
const prisma = require("../db");
const bcrypt = require("bcrypt");

// Function to hash the user's password
const hashPassword= async (password)=> {
  try {
    // const saltRounds = bcrypt.genSalt(10); // The number of salt rounds (adjust as needed)
    const saltRounds = (10); // The number of salt rounds (adjust as needed)
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    throw error;
  }
}
const finduser = async (q, role, status, page = 1, itemsPerPage = 10) => {
  try {
    // Validate page and itemsPerPage
    page = Math.max(1, parseInt(page, 10)); // Ensure page is at least 1
    itemsPerPage = Math.max(1, parseInt(itemsPerPage, 10)); // Ensure itemsPerPage is at least 1

    // Build the search filter object
    const where = {
      AND: [
        q ? { username: { contains: q } } : {},
        role ? { role: { name: { contains: role } } } : {},
        status ? { status: status } : {} // Directly filter by user status
      ]
    };

    console.log('Filter object:', JSON.stringify(where, null, 2)); // Log filter object

  // Ensure `page` and `itemsPerPage` are integers and handle default values
const pageNumber = parseInt(page, 10) || 1; // Default to page 1 if not provided
const itemsPerPageNumber = parseInt(itemsPerPage, 10) || 10; // Default to 10 items per page if not provided

// Calculate pagination values
const skip = (pageNumber - 1) * itemsPerPageNumber;
const take = itemsPerPageNumber;

// Fetch users with Prisma, including search criteria and pagination
const users = await prisma.user.findMany({
  where,
  include: {
    role: {
      include: {
        abilityRules: true
      },
    },
    karyawan: true,
  },
  skip: skip >= 0 ? skip : 0, // Ensure skip is non-negative
  take: take > 0 ? take : 10, // Ensure take is positive
});

    console.log('Fetched users:', JSON.stringify(users, null, 2)); // Log fetched users

    // Transform the user data to match the desired format
    const transformedUsers = users.map(user => ({
      id: user.id,
      idKaryawan: user.karyawan_id, // Assuming karyawan_id maps to idKaryawan
      nama: user.karyawan.nama || '', // Assuming username contains the desired name
      role: user.role?.name || '', // Assuming role has a nama field
      email: user.email,
      // username: `owner.${user.email.split('@')[0]}`, // Assuming username follows this pattern
      username: user.username, // Assuming username follows this pattern
      status: user.status || 'aktif', // Use user status or default to 'aktif'
      kontak: user.karyawan.kontak, // Directly use user status

      // abilityRules: user.role?.hak_akses.map(hak_akses => ({
      //   fungsi: hak_akses.fungsi?.nama || '', // Ensure fungsi is not undefined
      //   akses: hak_akses.akses?.nama || '', // Ensure akses is not undefined
      // })) || [], // Map hak_akses to the desired format
    }));

    console.log('Transformed users:', JSON.stringify(transformedUsers, null, 2)); // Log transformed users

    // Fetch total count for pagination
    const totalCount = await prisma.user.count({ where });

    console.log('Total user count:', role); // Log total count

    return {
      success: true,
      message: "Data pengguna berhasil ditemukan.",
      dataTitle: "Pengguna",
      itemsPerPage: itemsPerPage,
      totalPages: Math.ceil(totalCount / itemsPerPage),
      totalData: totalCount,
      page: page,
      data: transformedUsers
    };

  } catch (error) {
    console.error('Error finding users:', error);
    return {
      success: false,
      message: 'Terjadi kesalahan saat mencari data pengguna.',
    };
  }
};


const finduserById = async (id) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        role: {
          include: {
            abilityRules: true
           
          },
        },
        karyawan: true, // Assuming karyawan model has fields like nama, foto, gender, noHp, alamat
      },
    });

    if (!user) {
      return {
        success: false,
        message: `Pengguna dengan ID ${id} tidak ditemukan.`,
      };
    }

    // Transform the user data to match the desired format
    const transformedUser = {
      id: user.id,
      idKaryawan: user.karyawan_id, // Assuming karyawan_id maps to idKaryawan
      nama: user.karyawan?.nama ||user.username|| '', // Assuming karyawan has a nama field
      role: user.role?.name || '', // Assuming role has a nama field
      email: user.email,
      username: `owner.${user.email.split('@')[0]}`, // Assuming username follows this pattern
      status: user.deleted_at ? "Inactive" : "Aktif", // Assuming status is "Aktif" if not deleted
      abilityRules: user.role?.abilityRules.map(permission => ({
        action: permission.action,
        subject: permission.subject,
        inverted: permission.inverted,
        conditions: permission.conditions,
      })) || [], // Map hak_akses to the desired format
      foto: user.karyawan?.foto || null, // Assuming karyawan has a foto field
      gender: user.karyawan?.jenis_kelamin || null, // Assuming karyawan has a gender field
      noHp: user.karyawan?.kontak || null, // Assuming karyawan has a noHp field
      alamat: user.karyawan?.alamat || null, // Assuming karyawan has an alamat field
    };

    return {
      success: true,
      message: `Data pengguna dengan ID ${id} berhasil diperoleh.`,
      data: transformedUser,
    };
  } catch (error) {
    console.error('Error finding user by ID:', error);
    return {
      success: false,
      message: 'Terjadi kesalahan saat mencari data pengguna.',
    };
  }
};


const insertUserRepo = async (newUserData) => {
  try {
    const { idKaryawan, nama, email, username, status } = newUserData;
    const roleName = newUserData.role;
    const hashedPassword = await hashPassword(newUserData.password);

    // Temukan ID peran berdasarkan nama peran
    const role = await prisma.role.findFirst({
      where: {
        name: roleName,
      },
    });

    if (!role) {
      throw new Error(`Peran dengan nama ${roleName} tidak ditemukan`);
    }
    const karyawan = await prisma.karyawan.findFirst({
      where: {
        id: idKaryawan,
      },
    });
    
    // Buat pengguna baru
    const user = await prisma.user.create({
      data: {
        username,
        email: karyawan.email ?? email, // Use karyawan.email if it exists; otherwise, use email
        password: hashedPassword, // Pastikan untuk meng-hash kata sandi
        karyawan_id: idKaryawan,
        role_id: role.id,
        status: status,
      },
    });
    

    return {
      success: true,
      message: `Pengguna berhasil dibuat dengan ID ${user.id}`,
      data: user,
    };
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      // Tangani kesalahan jika email sudah ada
      return {
        success: false,
        message: 'Email sudah digunakan oleh pengguna lain.',
      };
    }

    console.error("Kesalahan saat membuat pengguna:", error);
    return {
      success: false,
      message: `Gagal membuat pengguna: ${error.message}`,
    };
  }
};



const updateuserRepo = async (userId, updatedUserData) => {
  try {
    const { role, email, username, status } = updatedUserData;
    const roleName = role;

    // Temukan ID peran berdasarkan nama peran
    const roleRecord = await prisma.role.findFirst({
      where: {
        name: roleName,
      },
    });

    if (!roleRecord) {
      throw new Error(`Peran dengan nama ${roleName} tidak ditemukan`);
    }

    // Periksa apakah email sudah ada dan bukan milik pengguna yang sedang diperbarui
    // const existingUserWithEmail = await prisma.user.findFirst({
    //   where: {
    //     email: email,
    //     id: {
    //       not: parseInt(userId),
    //     },
    //   },
    // });

    // if (existingUserWithEmail) {
    //   throw new Error(`Email ${email} sudah digunakan oleh pengguna lain`);
    // }

    // Perbarui pengguna
    const updatedUser = await prisma.user.update({
      where: {
        id: parseInt(userId),
      },
      data: {
        role: {
          connect: {
            id: roleRecord.id
          }
        },
        email,
        username,
        status,
      },
    });

    return {
      success: true,
      message: `Pengguna dengan ID ${userId} berhasil diperbarui`,
      data: updatedUser,
    };
  } catch (error) {
    console.error("Kesalahan saat memperbarui pengguna:", error);
    return {
      success: false,
      message: `Gagal memperbarui pengguna: ${error.message}`,
    };
  }
};


const deleteUserByIdRepo = async (id) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      throw new Error(`Pengguna dengan ID ${id} tidak ditemukan`);
    }

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    return {
      success: true,
      message: `Pengguna dengan ID ${id} berhasil dihapus`,
    };
  } catch (error) {
    console.error("Kesalahan saat menghapus pengguna:", error);
    return {
      success: false,
      message: `Gagal menghapus pengguna: ${error.message}`,
    };
  }
};

module.exports={
  finduser,
  finduserById,
  insertUserRepo,
  updateuserRepo,
  deleteUserByIdRepo
}