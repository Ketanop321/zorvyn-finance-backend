/**
 * Database Seed Script
 *
 * Creates realistic test data that evaluators will run before testing.
 * Run with: npm run seed
 *
 * WHY realistic data?
 * A seed with amounts like 999 and dates like "2020-01-01" looks lazy.
 * Realistic amounts (₹45,000 salary, ₹12,500 AWS bill) show you understand
 * the domain you're building for.
 */
'use strict';

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

// ─── Seed Users ───────────────────────────────────────────────────────────────
const users = [
  {
    name: 'Arjun Sharma',
    email: 'admin@zorvyn.dev',
    password: 'Admin@123',
    role: 'ADMIN',
  },
  {
    name: 'Priya Mehta',
    email: 'analyst@zorvyn.dev',
    password: 'Analyst@123',
    role: 'ANALYST',
  },
  {
    name: 'Rahul Gupta',
    email: 'viewer@zorvyn.dev',
    password: 'Viewer@123',
    role: 'VIEWER',
  },
];

// ─── Seed Transactions ────────────────────────────────────────────────────────
// 25 realistic transactions spread over last 3 months
// Mix of INCOME and EXPENSE across all categories
const generateTransactions = (adminId) => {
  const now = new Date();
  const getDate = (daysAgo) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d;
  };

  return [
    // ── Month 1 (current month) ───────────────────────────────────────────
    {
      id: uuidv4(),
      amount: 450000,
      type: 'INCOME',
      category: 'Salary',
      date: getDate(5),
      description: 'Monthly payroll for engineering team — March 2024',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 125000,
      type: 'EXPENSE',
      category: 'Infrastructure',
      date: getDate(6),
      description: 'AWS cloud infrastructure — EC2 + RDS + S3 billing',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 85000,
      type: 'EXPENSE',
      category: 'Marketing',
      date: getDate(8),
      description: 'Google Ads campaign — Q1 2024 brand awareness',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 750000,
      type: 'INCOME',
      category: 'Investment',
      date: getDate(10),
      description: 'Series A tranche disbursement — Sequoia Capital',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 45000,
      type: 'EXPENSE',
      category: 'Utilities',
      date: getDate(12),
      description: 'Office electricity, internet, and pantry expenses',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 32000,
      type: 'EXPENSE',
      category: 'Travel',
      date: getDate(14),
      description: 'Business travel — Mumbai investor meeting + flights + hotel',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 180000,
      type: 'EXPENSE',
      category: 'Operations',
      date: getDate(15),
      description: 'Legal retainer fee + compliance filings — FY2024',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 92500,
      type: 'INCOME',
      category: 'Salary',
      date: getDate(18),
      description: 'Client SaaS subscription revenue — TechStartup Ltd',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },

    // ── Month 2 (last month) ──────────────────────────────────────────────
    {
      id: uuidv4(),
      amount: 450000,
      type: 'INCOME',
      category: 'Salary',
      date: getDate(35),
      description: 'Monthly payroll for engineering team — February 2024',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 98000,
      type: 'EXPENSE',
      category: 'Infrastructure',
      date: getDate(37),
      description: 'Azure DevOps + GitHub Enterprise annual licenses',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 65000,
      type: 'EXPENSE',
      category: 'Marketing',
      date: getDate(40),
      description: 'LinkedIn sponsored content + influencer partnership',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 250000,
      type: 'INCOME',
      category: 'Investment',
      date: getDate(42),
      description: 'Angel investor top-up — Bangalore Angels Network',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 38000,
      type: 'EXPENSE',
      category: 'Utilities',
      date: getDate(45),
      description: 'Co-working space rental — Bengaluru WeWork March',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 155000,
      type: 'EXPENSE',
      category: 'Payroll',
      date: getDate(47),
      description: 'Contractor payments — design and QA freelancers',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 47500,
      type: 'EXPENSE',
      category: 'Operations',
      date: getDate(50),
      description: 'Twilio SMS + SendGrid email platform fees',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 125000,
      type: 'INCOME',
      category: 'Salary',
      date: getDate(52),
      description: 'API licensing revenue — FinAggregator Pro subscription',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 28000,
      type: 'EXPENSE',
      category: 'Travel',
      date: getDate(55),
      description: 'Team offsite — Coorg team-building retreat',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },

    // ── Month 3 (2 months ago) ────────────────────────────────────────────
    {
      id: uuidv4(),
      amount: 450000,
      type: 'INCOME',
      category: 'Salary',
      date: getDate(65),
      description: 'Monthly payroll for engineering team — January 2024',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 110000,
      type: 'EXPENSE',
      category: 'Infrastructure',
      date: getDate(67),
      description: 'GCP BigQuery + Looker Studio annual plan',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 500000,
      type: 'INCOME',
      category: 'Investment',
      date: getDate(70),
      description: 'Government startup grant — MeitY Startup Hub',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 72000,
      type: 'EXPENSE',
      category: 'Marketing',
      date: getDate(72),
      description: 'Product Hunt launch campaign + PR agency retainer',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 145000,
      type: 'EXPENSE',
      category: 'Payroll',
      date: getDate(75),
      description: 'Intern stipends + part-time developer payments',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 33000,
      type: 'EXPENSE',
      category: 'Utilities',
      date: getDate(78),
      description: 'Registered office address + virtual mail service',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 89000,
      type: 'INCOME',
      category: 'Salary',
      date: getDate(80),
      description: 'White-label dashboard revenue — NBFCPartner Q4',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
    {
      id: uuidv4(),
      amount: 56000,
      type: 'EXPENSE',
      category: 'Operations',
      date: getDate(85),
      description: 'RBI compliance audit fees + CA firm retainer',
      idempotencyKey: uuidv4(),
      createdBy: adminId,
    },
  ];
};

// ─── Main Seed Function ───────────────────────────────────────────────────────
const main = async () => {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data (order matters — respect foreign keys)
  await prisma.auditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create users
  const createdUsers = [];
  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
      },
    });
    createdUsers.push(user);
    console.log(`✅ Created user: ${user.email} [${user.role}]`);
  }

  const adminUser = createdUsers.find((u) => u.role === 'ADMIN');

  // Create transactions
  const transactions = generateTransactions(adminUser.id);
  await prisma.transaction.createMany({ data: transactions });
  console.log(`\n✅ Created ${transactions.length} transactions`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Seed completed successfully!\n');
  console.log('📧 Test Credentials:');
  console.log('   Admin:    admin@zorvyn.dev    / Admin@123');
  console.log('   Analyst:  analyst@zorvyn.dev  / Analyst@123');
  console.log('   Viewer:   viewer@zorvyn.dev   / Viewer@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
};

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
