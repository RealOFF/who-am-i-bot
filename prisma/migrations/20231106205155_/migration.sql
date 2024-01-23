-- CreateEnum
CREATE TYPE "TextRequestType" AS ENUM ('SETUP_ROLE_NAME');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeTextRequestType" "TextRequestType";
