-- AlterTable
ALTER TABLE `karyawan` ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `nama_akun` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `supplier` ADD COLUMN `bank` VARCHAR(191) NULL,
    ADD COLUMN `nama_akun` VARCHAR(191) NULL;
