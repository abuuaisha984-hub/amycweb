ALTER TABLE "Category" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "Category_type_active_idx" ON "Category"("type", "active");
