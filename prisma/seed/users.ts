import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User } from "@prisma/client";

const SEED_USERS = 500;

const USER_ROLES = ["USER", "USER", "USER", "ADMIN", "MODERATOR"] as const;

export async function seedUsers(
  ctx: SeedContext,
  counts: SeedCounts,
): Promise<User[]> {
  console.log("Seeding users...");

  const defaultPassword = process.env.DEFAULT_USER_PASSWORD || "password123";

  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const usersData = Array.from({ length: SEED_USERS }, (_, index) => ({
    email: faker.internet.email().toLowerCase() + `.${index}`,
    name: faker.person.fullName(),
    password: hashedPassword,
    role: faker.helpers.arrayElement(USER_ROLES),
  }));

  await ctx.prisma.user.createMany({
    data: usersData,
    skipDuplicates: true,
  });

  const users = await ctx.prisma.user.findMany({
    select: { id: true },
  });

  counts.users = users.length;

  console.log(`Created ${users.length} users`);

  await ctx.prisma.profile.createMany({
    data: users.map((user) => ({
      userId: user.id,
      bio: faker.lorem.sentences(2),
      avatar: faker.image.avatar(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(true),
    })),
    skipDuplicates: true,
  });

  counts.profiles = users.length;

  console.log(`Created ${users.length} profiles`);

  return ctx.prisma.user.findMany();
}
