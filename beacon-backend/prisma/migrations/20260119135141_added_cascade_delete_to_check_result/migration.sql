-- DropForeignKey
ALTER TABLE "CheckResult" DROP CONSTRAINT "CheckResult_endpointId_fkey";

-- AddForeignKey
ALTER TABLE "CheckResult" ADD CONSTRAINT "CheckResult_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "Endpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
