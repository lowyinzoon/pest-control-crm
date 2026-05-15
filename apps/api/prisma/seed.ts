import { PrismaClient, UserRole, PricingType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default branch
  const branch = await prisma.branch.upsert({
    where: { code: 'KL' },
    update: {},
    create: {
      name: 'Kuala Lumpur HQ',
      code: 'KL',
      address: 'Kuala Lumpur, Malaysia',
      phone: '+60312345678',
      email: 'kl@pestcontrol.com',
    },
  });

  console.log(`Branch created: ${branch.name} (${branch.code})`);

  // Create Super Admin
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pestcontrol.com' },
    update: {},
    create: {
      email: 'admin@pestcontrol.com',
      password: hashedPassword,
      fullName: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
      branchId: branch.id,
    },
  });

  console.log(`Super Admin created: ${admin.email}`);

  // Create sample users
  const users = [
    { email: 'manager@pestcontrol.com', fullName: 'Branch Manager', role: UserRole.BRANCH_MANAGER },
    { email: 'sales@pestcontrol.com', fullName: 'Sales Person', role: UserRole.SALES },
    { email: 'tech@pestcontrol.com', fullName: 'Ahmad Technician', role: UserRole.TECHNICIAN },
    { email: 'finance@pestcontrol.com', fullName: 'Finance Admin', role: UserRole.FINANCE },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password: hashedPassword,
        fullName: u.fullName,
        role: u.role,
        branchId: branch.id,
      },
    });
    console.log(`User created: ${u.email} (${u.role})`);
  }

  // Create pricing rules
  const pricingRules = [
    { serviceType: 'General Pest Control', pricingType: PricingType.PER_VISIT, baseRate: 150, minimumPrice: 120, costRate: 45 },
    { serviceType: 'Termite Treatment', pricingType: PricingType.PER_SQFT, baseRate: 0.35, minimumPrice: 300, costRate: 0.10 },
    { serviceType: 'Rodent Control', pricingType: PricingType.PER_UNIT, baseRate: 85, minimumPrice: 200, costRate: 25 },
    { serviceType: 'Mosquito Fogging', pricingType: PricingType.FIXED, baseRate: 250, minimumPrice: 200, costRate: 80 },
    { serviceType: 'Bed Bug Treatment', pricingType: PricingType.PER_SQFT, baseRate: 0.55, minimumPrice: 400, costRate: 0.18 },
    { serviceType: 'Disinfection Service', pricingType: PricingType.PER_SQFT, baseRate: 0.15, minimumPrice: 200, costRate: 0.05 },
  ];

  for (const rule of pricingRules) {
    await prisma.pricingRule.upsert({
      where: { serviceType_branchId: { serviceType: rule.serviceType, branchId: branch.id } },
      update: {},
      create: { ...rule, branchId: branch.id },
    });
  }
  console.log(`${pricingRules.length} pricing rules created`);

  // Create area tiers for Termite Treatment
  const areaTiers = [
    { serviceType: 'Termite Treatment', minArea: 0, maxArea: 2000, ratePerSqft: 0.45 },
    { serviceType: 'Termite Treatment', minArea: 2001, maxArea: 5000, ratePerSqft: 0.38 },
    { serviceType: 'Termite Treatment', minArea: 5001, maxArea: 10000, ratePerSqft: 0.30 },
    { serviceType: 'Termite Treatment', minArea: 10001, maxArea: null, ratePerSqft: 0.25 },
  ];

  for (const tier of areaTiers) {
    await prisma.areaTier.create({
      data: { ...tier, branchId: branch.id },
    });
  }
  console.log(`${areaTiers.length} area tiers created`);

  console.log('\nSeed complete!');
  console.log('Login: admin@pestcontrol.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
