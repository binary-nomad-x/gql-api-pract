import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import type { SeedContext, SeedCounts } from "./types.js";

export async function seedUsers(ctx: SeedContext, counts: SeedCounts, count: number): Promise<string[]> {
  const password = "password123";
  const passwordHash = bcrypt.hashSync(password, 10);

  // Fixed test users
  const userData = [
    {
      email: "admin@test.com",
      username: "sysadmin",
      name: "System Administrator",
      age: 35,
      role: "ADMIN",
      password: passwordHash,
      avatarUrl: faker.image.avatar(),
      bio: "Platform administrator with full access to all systems.",
      phone: faker.phone.number(),
      isVerified: true,
      lastLoginAt: faker.date.recent(),
      locale: "en-US",
      timezone: "America/New_York",
      metadata: { department: "IT", employeeId: "EMP001", accessLevel: "full" },
    },
    {
      email: "admin2@test.com",
      username: "alice_admin",
      name: "Alice Johnson",
      age: 32,
      role: "ADMIN",
      password: passwordHash,
      avatarUrl: faker.image.avatar(),
      bio: "Senior administrator managing daily operations.",
      phone: faker.phone.number(),
      isVerified: true,
      lastLoginAt: faker.date.recent(),
      locale: "en-US",
      timezone: "America/Chicago",
      metadata: { department: "Operations", employeeId: "EMP002", accessLevel: "full" },
    },
    {
      email: "moderator@test.com",
      username: "diana_mod",
      name: "Diana Prince",
      age: 37,
      role: "MODERATOR",
      password: passwordHash,
      avatarUrl: faker.image.avatar(),
      bio: "Content moderator ensuring quality across the platform.",
      phone: faker.phone.number(),
      isVerified: true,
      lastLoginAt: faker.date.recent(),
      locale: "en-US",
      timezone: "America/Denver",
      metadata: { department: "Content", employeeId: "EMP003", accessLevel: "moderate" },
    },
    {
      email: "manager@test.com",
      username: "michael_mgr",
      name: "Michael Scott",
      age: 42,
      role: "MANAGER",
      password: passwordHash,
      avatarUrl: faker.image.avatar(),
      bio: "Regional manager overseeing team performance and growth.",
      phone: faker.phone.number(),
      isVerified: true,
      lastLoginAt: faker.date.recent(),
      locale: "en-US",
      timezone: "America/New_York",
      metadata: { department: "Management", employeeId: "EMP004", accessLevel: "manager" },
    },
    {
      email: "seller@test.com",
      username: "sarah_seller",
      name: "Sarah Parker",
      age: 30,
      role: "SELLER",
      password: passwordHash,
      avatarUrl: faker.image.avatar(),
      bio: "Top-rated seller specializing in electronics and gadgets.",
      phone: faker.phone.number(),
      isVerified: true,
      lastLoginAt: faker.date.recent(),
      locale: "en-US",
      timezone: "America/Los_Angeles",
      metadata: { storeName: "TechEmporium", sellerSince: "2023-01-15", rating: 4.9 },
    },
    {
      email: "customer@test.com",
      username: "bob_customer",
      name: "Bob Smith",
      age: 29,
      role: "USER",
      password: passwordHash,
      avatarUrl: faker.image.avatar(),
      bio: "Regular customer who enjoys shopping for deals.",
      phone: faker.phone.number(),
      isVerified: true,
      lastLoginAt: faker.date.recent(),
      locale: "en-US",
      timezone: "America/Chicago",
      metadata: { memberSince: "2024-06-01", loyaltyTier: "gold" },
    },
    {
      email: "customer2@test.com",
      username: "eve_customer",
      name: "Eve Adams",
      age: 24,
      role: "USER",
      password: passwordHash,
      avatarUrl: faker.image.avatar(),
      bio: "Tech enthusiast and early adopter of new products.",
      phone: faker.phone.number(),
      isVerified: true,
      lastLoginAt: faker.date.recent(),
      locale: "en-US",
      timezone: "America/New_York",
      metadata: { memberSince: "2024-09-15", loyaltyTier: "silver" },
    },
    {
      email: "customer3@test.com",
      username: "charlie_customer",
      name: "Charlie Brown",
      age: 27,
      role: "USER",
      password: passwordHash,
      avatarUrl: faker.image.avatar(),
      bio: "Love exploring new categories and finding hidden gems.",
      phone: faker.phone.number(),
      isVerified: true,
      lastLoginAt: faker.date.recent(),
      locale: "en-US",
      timezone: "America/Denver",
      metadata: { memberSince: "2024-03-20", loyaltyTier: "bronze" },
    },
  ];

  const roles = ["USER", "USER", "USER", "SELLER", "MANAGER"];

  for (let i = userData.length; i < count; i++) {
    userData.push({
      email: faker.internet.email().toLowerCase(),
      username: faker.internet.username().toLowerCase(),
      name: faker.person.fullName(),
      age: faker.number.int({ min: 18, max: 60 }),
      role: faker.helpers.arrayElement(roles),
      password: passwordHash,
      avatarUrl: faker.image.avatar(),
      bio: faker.lorem.sentence({ min: 5, max: 30 }),
      phone: faker.phone.number(),
      isVerified: faker.datatype.boolean({ probability: 0.7 }),
      lastLoginAt: faker.date.recent({ days: 30 }),
      locale: faker.helpers.arrayElement(["en-US", "en-GB", "es-ES", "fr-FR", "de-DE"]),
      timezone: faker.helpers.arrayElement([
        "America/New_York",
        "America/Chicago",
        "America/Denver",
        "America/Los_Angeles",
        "Europe/London",
        "Europe/Berlin",
      ]),
      metadata: {
        signupSource: faker.helpers.arrayElement(["web", "mobile", "referral"]),
        memberSince: faker.date.past({ years: 2 }).toISOString(),
        loyaltyTier: faker.helpers.arrayElement(["bronze", "silver", "gold", "platinum"]),
      },
    });
  }

  const users = await Promise.all(
    userData.map(({ locale, timezone, metadata, ...data }) =>
      ctx.prisma.user.create({
        data: {
          ...data,
          locale,
          timezone,
          metadata: JSON.parse(JSON.stringify(metadata)),
        },
      }),
    ),
  );

  await Promise.all(
    users.map((user) =>
      ctx.prisma.profile.create({
        data: {
          userId: user.id,
          bio: faker.lorem.sentence({ min: 5, max: 30 }),
          avatar: faker.image.avatar(),
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          fullName: faker.person.fullName(),
          dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: "age" }),
          gender: faker.helpers.arrayElement(["male", "female", "other"]),
          occupation: faker.person.jobTitle(),
          company: faker.company.name(),
          website: faker.internet.url(),
          education: faker.helpers.arrayElement(["High School", "Bachelor's", "Master's", "PhD", "Associate's"]),
          newsletter: faker.datatype.boolean({ probability: 0.8 }),
          marketingOptIn: faker.datatype.boolean({ probability: 0.6 }),
        },
      }),
    ),
  );

  counts.users += users.length;
  counts.profiles += users.length;

  const userIds = users.map((u) => u.id);

  // Print only one account per role
  console.log("\n========================================");
  console.log(" Test Accounts");
  console.log("========================================");

  const shownRoles = new Set<string>();

  for (const user of userData) {
    if (shownRoles.has(user.role)) continue;

    shownRoles.add(user.role);

    console.log(`${user.role.padEnd(10)} | ${user.email.padEnd(28)} | ${password}`);
  }

  console.log("========================================\n");

  return userIds;
}
