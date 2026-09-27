const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.admin.findFirst();
  if (!existing) {
    const admin = await prisma.admin.create({
      data: {
        email: 'admin@sangam.com',
        password: 'sangam@admin2026'
      }
    });
    console.log('Created admin:', admin.email);
  } else {
    console.log('Admin already exists:', existing.email);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
