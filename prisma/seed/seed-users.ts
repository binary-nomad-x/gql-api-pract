import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import type { SeedContext, SeedCounts } from "./types.js";

export async function seedUsers(
  ctx: SeedContext,
  counts: SeedCounts,
  count: number,
): Promise<string[]> {
  const password = "password123";
  const passwordHash = bcrypt.hashSync(password, 10);

  // Fixed test users
  const userData = [
    {
      email: "admin@test.com",
      name: "System Administrator",
      age: 35,
      role: "ADMIN",
      password: passwordHash,
    },
    {
      email: "admin2@test.com",
      name: "Alice Johnson",
      age: 32,
      role: "ADMIN",
      password: passwordHash,
    },
    {
      email: "moderator@test.com",
      name: "Diana Prince",
      age: 37,
      role: "MODERATOR",
      password: passwordHash,
    },
    {
      email: "manager@test.com",
      name: "Michael Scott",
      age: 42,
      role: "MANAGER",
      password: passwordHash,
    },
    {
      email: "seller@test.com",
      name: "Sarah Parker",
      age: 30,
      role: "SELLER",
      password: passwordHash,
    },
    {
      email: "customer@test.com",
      name: "Bob Smith",
      age: 29,
      role: "USER",
      password: passwordHash,
    },
    {
      email: "customer2@test.com",
      name: "Eve Adams",
      age: 24,
      role: "USER",
      password: passwordHash,
    },
    {
      email: "customer3@test.com",
      name: "Charlie Brown",
      age: 27,
      role: "USER",
      password: passwordHash,
    },
  ];

  const roles = ["USER", "USER", "USER", "SELLER", "MANAGER"];

  for (let i = userData.length; i < count; i++) {
    userData.push({
      email: faker.internet.email().toLowerCase(),
      name: faker.person.fullName(),
      age: faker.number.int({ min: 18, max: 60 }),
      role: faker.helpers.arrayElement(roles),
      password: passwordHash,
    });
  }

  const users = await Promise.all(
    userData.map((data) =>
      ctx.prisma.user.create({
        data,
      }),
    ),
  );

  await Promise.all(
    users.map((user) =>
      ctx.prisma.profile.create({
        data: {
          userId: user.id,
          bio: faker.lorem.sentence(),
          avatar: faker.image.avatar(),
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
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