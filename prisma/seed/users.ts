import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User, Role } from "@prisma/client";

const SEED_USERS = 500;
const USER_ROLES: Role[] = ["USER", "USER", "USER", "ADMIN", "MODERATOR"];

const FIXED_USERS: Array<{ email: string; name: string; role: Role }> = [
  { email: "alice@test.com", name: "Alice Johnson", role: "ADMIN" },
  { email: "bob@test.com", name: "Bob Smith", role: "USER" },
  { email: "charlie@test.com", name: "Charlie Brown", role: "USER" },
  { email: "diana@test.com", name: "Diana Prince", role: "MODERATOR" },
  { email: "eve@test.com", name: "Eve Adams", role: "USER" },
];

export async function seedUsers(ctx: SeedContext, counts: SeedCounts): Promise<User[]> {
  console.log("Seeding users...");
  const password = await bcrypt.hash("password123", 10);
  const fixed = FIXED_USERS.map((u) => ({ ...u, password }));

  const random = Array.from({ length: SEED_USERS - FIXED_USERS.length }, () => ({
    email: faker.internet.email().toLowerCase(),
    name: faker.person.fullName(),
    password,
    role: faker.helpers.arrayElement(USER_ROLES),
  }));

  await ctx.prisma.user.createMany({ data: [...fixed, ...random] });
  const users = await ctx.prisma.user.findMany();
  counts.users = users.length;
  console.log(`Created ${users.length} users`);

  await ctx.prisma.profile.createMany({
    data: users.map((u) => ({
      userId: u.id,
      bio: faker.lorem.sentence(),
      avatar: faker.image.avatar(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
    })),
  });

  counts.profiles = users.length;
  console.log(`Created ${users.length} profiles`);
  return users;
}
