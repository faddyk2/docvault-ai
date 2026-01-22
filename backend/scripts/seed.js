const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        email: 'admin@test.com',
        password: adminPassword,
        role: 'admin'
      }
    });

    const user = await prisma.user.upsert({
      where: { email: 'user@test.com' },
      update: {},
      create: {
        email: 'user@test.com',
        password: userPassword,
        role: 'user'
      }
    });

    console.log('✅ Created admin user:', { email: admin.email, role: admin.role });
    console.log('✅ Created regular user:', { email: user.email, role: user.role });
    console.log('\n📝 Login credentials:');
    console.log('   Admin: admin@test.com / admin123');
    console.log('   User:  user@test.com / user123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
