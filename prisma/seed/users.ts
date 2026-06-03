import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User } from "@prisma/client";

const FIXED_USER_COUNT = 5;
const SEED_USERS = 200;

/**
 * Fixed test accounts that are always created so consumers
 * have known credentials to log in with.
 */
const FIXED_USERS: Array<{ email: string; name: string; role: "ADMIN" | "USER" | "MODERATOR" }> = [
  { email: "alice@test.com", name: "Alice Johnson", role: "ADMIN" },
  { email: "bob@test.com", name: "Bob Smith", role: "USER" },
  { email: "charlie@test.com", name: "Charlie Brown", role: "USER" },
  { email: "diana@test.com", name: "Diana Prince", role: "MODERATOR" },
  { email: "eve@test.com", name: "Eve Adams", role: "USER" },
];

const USER_ROLES: Array<"USER" | "ADMIN" | "MODERATOR"> = [
  "USER", "USER", "USER", "ADMIN", "MODERATOR",
];

/**
 * Seed users and their profiles.
 * Returns the created user records so other seeders can reference them via FK.
 */
export async function seedUsers(ctx: SeedContext, counts: SeedCounts): Promise<User[]> {
  console.log("Seeding users...");
  const password = await bcrypt.hash("password123", 10);
  const users: User[] = [];

  // Fixed test accounts
  for (const u of FIXED_USERS) {
    users.push(await ctx.prisma.user.create({ data: { ...u, password } }));
  }

  // Random users
  for (let i = 0; i < SEED_USERS - FIXED_USER_COUNT; i++) {
    users.push(
      await ctx.prisma.user.create({
        data: {
          email: faker.internet.email().toLowerCase(),
          name: faker.person.fullName(),
          password,
          role: faker.helpers.arrayElement(USER_ROLES),
        },
      }),
    );
  }
  counts.users = users.length;
  console.log(`Created ${users.length} users`);

  // Profiles
  for (const user of users) {
    await ctx.prisma.profile.create({
      data: {
        userId: user.id,
        bio: faker.lorem.sentence(),
        avatar: faker.image.avatar(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
      },
    });
  }
  counts.profiles = users.length;
  console.log(`Created ${users.length} profiles`);

  return users;
}
