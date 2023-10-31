-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "isCreator" SET DEFAULT false;
