/*
  Warnings:

  - A unique constraint covering the columns `[activeRoleId]` on the table `Round` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `order` to the `Role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `activeRoleId` to the `Round` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "order" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Round" ADD COLUMN     "activeRoleId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Round_activeRoleId_key" ON "Round"("activeRoleId");

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_activeRoleId_fkey" FOREIGN KEY ("activeRoleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
