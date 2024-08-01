const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.role.create({
    data: {
      name: 'Owner',
      abilityRules: {
        create: [
          { action: 'manage', subject: 'all' },
        ],
      },
    },
  });

  await prisma.role.create({
    data: {
      name: 'Admin',
      abilityRules: {
        create: [
          { action: 'manage', subject: 'all' },
          { action: 'create', subject: 'master-karyawan', inverted: true },
          { action: 'update', subject: 'master-karyawan', inverted: true },
          { action: 'delete', subject: 'master-karyawan', inverted: true },
          { action: 'read', subject: 'master' },
        ],
      },
    },
  });

  await prisma.role.create({
    data: {
      name: 'Sales',
      abilityRules: {
        create: [
          { action: 'read', subject: 'dashboards' },
          { action: 'read', subject: 'halaman-profil-pengguna', conditions: true },
          { action: 'update', subject: 'halaman-profil-pengguna', conditions: true },
          { action: 'read', subject: 'master-produk' },
          { action: 'read', subject: 'master-gawangan' },
          { action: 'read', subject: 'master-outlet' },
          { action: 'read', subject: 'master-rak' },
          { action: 'create', subject: 'operasi-penjualan' },
          { action: 'read', subject: 'operasi-penjualan', conditions: true },
          { action: 'update', subject: 'operasi-penjualan', conditions: true },
          { action: 'read', subject: 'master' },
          { action: 'read', subject: 'operasi' },
        ],
      },
    },
  });

  await prisma.role.create({
    data: {
      name: 'Penjahit',
      abilityRules: {
        create: [
          { action: 'read', subject: 'dashboards' },
          { action: 'read', subject: 'halaman-profil-pengguna', conditions: true },
          { action: 'update', subject: 'halaman-profil-pengguna', conditions: true },
          { action: 'read', subject: 'master-bahan' },
          { action: 'read', subject: 'master-produk' },
          { action: 'create', subject: 'operasi-produksi' },
          { action: 'read', subject: 'operasi-produksi', conditions: true },
          { action: 'update', subject: 'operasi-produksi', conditions: true },
          { action: 'read', subject: 'master' },
          { action: 'read', subject: 'operasi' },
        ],
      },
    },
  });

  await prisma.role.create({
    data: {
      name: 'QC',
      abilityRules: {
        create: [
          { action: 'read', subject: 'dashboards' },
          { action: 'read', subject: 'halaman-profil-pengguna', conditions: true },
          { action: 'update', subject: 'halaman-profil-pengguna', conditions: true },
          { action: 'read', subject: 'master-bahan' },
          { action: 'read', subject: 'master-produk' },
          { action: 'read', subject: 'master-rak' },
          { action: 'read', subject: 'operasi-pengadaan-bahan' },
          { action: 'update', subject: 'operasi-pengadaan-bahan' },
          { action: 'create', subject: 'operasi-qc-bahan' },
          { action: 'read', subject: 'operasi-qc-bahan' },
          { action: 'update', subject: 'operasi-qc-bahan' },
          { action: 'read', subject: 'operasi-produksi' },
          { action: 'update', subject: 'operasi-produksi' },
          { action: 'create', subject: 'operasi-qc-produk' },
          { action: 'read', subject: 'operasi-qc-produk' },
          { action: 'update', subject: 'operasi-qc-produk' },
          { action: 'read', subject: 'master' },
          { action: 'read', subject: 'operasi' },
        ],
      },
    },
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
