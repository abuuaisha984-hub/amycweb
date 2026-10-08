const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

const models = [
  "user",
  "category",
  "article",
  "event",
  "region",
  "programme",
  "project",
  "document",
  "mediaItem",
  "gallery",
  "galleryItem",
  "page",
  "leader",
  "contactMessage",
  "visitEvent",
  "visitor",
  "siteSetting",
  "socialLink",
  "externalLink",
  "auditLog",
  "school",
];

async function main() {
  let total = 0;

  for (const model of models) {
    const count = await db[model].count();
    total += count;
    console.log(`${model}: ${count}`);
  }

  console.log(`TOTAL: ${total}`);
}

main()
  .catch((error) => {
    console.error("VERIFICATION FAILED:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
