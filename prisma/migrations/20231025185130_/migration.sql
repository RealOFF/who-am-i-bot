/*
  Warnings:

  - You are about to drop the column `name` on the `Session` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Round" ALTER COLUMN "isActive" SET DEFAULT true;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "name";
