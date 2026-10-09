const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();

  try {
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, rolled_back_at
      FROM "_prisma_migrations"
      ORDER BY started_at DESC
      LIMIT 5
    `;

    const columns = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'User'
        AND column_name = 'authVersion'
    `;

    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'PasswordResetToken',
          'PasswordRecoveryRateLimit'
        )
      ORDER BY table_name
    `;

    console.log("\nRecent migrations:");
    console.log(JSON.stringify(migrations, null, 2));

    console.log("\nauthVersion exists:", columns.length > 0);
    console.log("Password recovery tables:", JSON.stringify(tables));
  } catch (error) {
    console.log("Read-only check failed.");
    console.log("Error code:", error.code || "not available");
    console.log("Error name:", error.name || "unknown");
  } finally {
    await prisma.$disconnect();
  }
}

main();
