DELETE FROM "GalleryItem"
WHERE rowid NOT IN (
  SELECT MIN(rowid)
  FROM "GalleryItem"
  GROUP BY "galleryId", "mediaUrl"
);

CREATE UNIQUE INDEX "GalleryItem_galleryId_mediaUrl_key"
ON "GalleryItem"("galleryId", "mediaUrl");
