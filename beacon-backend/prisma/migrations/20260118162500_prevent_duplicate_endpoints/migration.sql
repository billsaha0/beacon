/*
  Warnings:

  - A unique constraint covering the columns `[userId,url,method]` on the table `Endpoint` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Endpoint_userId_url_method_key" ON "Endpoint"("userId", "url", "method");
