-- CreateTable
CREATE TABLE "post2" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "post2_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "post2_name_key" ON "post2"("name");

-- CreateIndex
CREATE UNIQUE INDEX "post2_slug_key" ON "post2"("slug");
