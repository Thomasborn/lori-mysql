const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Seed `user` data
  const users = [
    {
      // id: 3,
      email: 'test@examplse.com',
      password: '$2b$10$to1XA4.UViLN4PMUSs7ITe5AngUI3bQsWDC84Srxywp2G5p/m.FvC',
      karyawanId: 1,
      roleId: 2,
      created_at: new Date('2024-06-17T01:48:45.372Z'),
      deleted_at: null,
      updated_at: new Date('2024-06-17T01:48:45.372Z'),
      username: 'test',
      status: null,
    },
    {
      // id: 4,
      email: 'email@sam2psel.com',
      password: 'wisudajuli',
      karyawanId: 1,
      roleId: 2,
      created_at: new Date('2024-06-17T01:54:19.559Z'),
      deleted_at: null,
      updated_at: new Date('2024-06-17T01:54:19.559Z'),
      username: 'pengguna.sampel',
      status: null,
    },
    {
      // id: 5,
      email: 'nbroseman@lori.com',
      password: 'wisudajuli',
      karyawanId: 4,
      roleId: 12,
      created_at: new Date('2024-07-03T13:35:57.751Z'),
      deleted_at: null,
      updated_at: new Date('2024-07-03T13:35:57.751Z'),
      username: 'owner.nbroseman',
      status: null,
    },
    {
      // id: 6,
      email: 'gaspinal@lori.com',
      password: 'wisudajuli',
      karyawanId: 5,
      roleId: 13,
      created_at: new Date('2024-07-03T13:40:11.899Z'),
      deleted_at: null,
      updated_at: new Date('2024-07-03T13:40:11.899Z'),
      username: 'admin.gaspinal',
      status: null,
    },
    {
      // id: 7,
      email: 'lnoller@lori.com',
      password: 'wisudajuli',
      karyawanId: 6,
      roleId: 14,
      created_at: new Date('2024-07-03T13:41:46.600Z'),
      deleted_at: null,
      updated_at: new Date('2024-07-03T13:41:46.600Z'),
      username: 'sales.lnoller',
      status: null,
    },
    {
      // id: 8,
      email: 'dlintill@lori.com',
      password: 'wisudajuli',
      karyawanId: 7,
      roleId: 15,
      created_at: new Date('2024-07-03T13:44:14.557Z'),
      deleted_at: null,
      updated_at: new Date('2024-07-03T13:44:14.557Z'),
      username: 'penjahit.dlintill',
      status: null,
    },
    {
      // id: 9,
      email: 'ukunz@lori.com',
      password: 'wisudajuli',
      karyawanId: 8,
      roleId: 16,
      created_at: new Date('2024-07-03T13:45:20.306Z'),
      deleted_at: null,
      updated_at: new Date('2024-07-03T13:45:20.306Z'),
      username: 'qc.ukunz',
      status: null,
    },
    {
      // id: 10,
      email: 'qc1@lori.com',
      password: 'wisudajuli',
      karyawanId: 7,
      roleId: 10,
      created_at: new Date('2024-07-07T06:45:28.641Z'),
      deleted_at: null,
      updated_at: new Date('2024-07-07T06:45:28.641Z'),
      username: 'qc.qc1',
      status: null,
    },
  ];

  for (const user of users) {
    await prisma.user.create({
      data: {
        // id: user.id,
        email: user.email,
        password: user.password,
        karyawan: {
          connect: { id: user.karyawanId },
        },
        role: {
          connect: { id: user.roleId },
        },
        created_at: user.created_at,
        deleted_at: user.deleted_at,
        updated_at: user.updated_at,
        username: user.username,
        status: user.status,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
