-- CreateTable
CREATE TABLE "post1" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "post1_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "post1_name_key" ON "post1"("name");

-- CreateIndex
CREATE UNIQUE INDEX "post1_slug_key" ON "post1"("slug");
