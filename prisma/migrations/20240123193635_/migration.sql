/*
  Warnings:

  - You are about to drop the column `playerId` on the `Role` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[assignedToId]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `assignedToId` to the `Role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Role` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_playerId_fkey";

-- DropIndex
DROP INDEX "Role_playerId_key";

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "playerId",
ADD COLUMN     "assignedToId" INTEGER NOT NULL,
ADD COLUMN     "createdById" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Role_assignedToId_key" ON "Role"("assignedToId");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
