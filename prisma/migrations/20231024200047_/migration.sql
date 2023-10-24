/*
  Warnings:

  - You are about to drop the column `attendId` on the `Session` table. All the data in the column will be lost.
  - Added the required column `name` to the `Session` table without a default value. This is not possible if the table is not empty.
  - The required column `password` was added to the `Session` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `language` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "attendId",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "language" TEXT NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL;
