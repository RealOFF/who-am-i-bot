/*
  Warnings:

  - A unique constraint covering the columns `[password]` on the table `Session` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Player_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Session_password_key" ON "Session"("password");
