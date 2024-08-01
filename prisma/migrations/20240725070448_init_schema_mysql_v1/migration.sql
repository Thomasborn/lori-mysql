/*
  Warnings:

  - You are about to drop the column `created_at` on the `role` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `role` table. All the data in the column will be lost.
  - You are about to drop the column `nama` on the `role` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `role` table. All the data in the column will be lost.
  - You are about to drop the `akses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fungsi` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hak_akses` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `role` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `hak_akses` DROP FOREIGN KEY `hak_akses_akses_id_fkey`;

-- DropForeignKey
ALTER TABLE `hak_akses` DROP FOREIGN KEY `hak_akses_fungsi_id_fkey`;

-- DropForeignKey
ALTER TABLE `hak_akses` DROP FOREIGN KEY `hak_akses_role_id_fkey`;

-- AlterTable
ALTER TABLE `role` DROP COLUMN `created_at`,
    DROP COLUMN `deleted_at`,
    DROP COLUMN `nama`,
    DROP COLUMN `updated_at`,
    ADD COLUMN `name` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `akses`;

-- DropTable
DROP TABLE `fungsi`;

-- DropTable
DROP TABLE `hak_akses`;

-- CreateTable
CREATE TABLE `ability_rule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `inverted` BOOLEAN NULL,
    `conditions` BOOLEAN NULL,
    `roleId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `role_name_key` ON `role`(`name`);

-- AddForeignKey
ALTER TABLE `ability_rule` ADD CONSTRAINT `ability_rule_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
