const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();

  try {
    const result = await prisma.$queryRaw`
      SELECT current_database() AS db,
             current_schema() AS schema
    `;

    console.log("Database connection: SUCCESS");
    console.log("Database:", result[0].db);
    console.log("Schema:", result[0].schema);
  } catch (error) {
    console.log("Database connection: FAILED");
    console.log("Error code:", error.code || "not available");
    console.log("Error name:", error.name || "unknown");
  } finally {
    await prisma.$disconnect();
  }
}

main();
