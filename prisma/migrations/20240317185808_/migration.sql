-- DropForeignKey
ALTER TABLE "Round" DROP CONSTRAINT "Round_activeRoleId_fkey";

-- AlterTable
ALTER TABLE "Round" ALTER COLUMN "activeRoleId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_activeRoleId_fkey" FOREIGN KEY ("activeRoleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
