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

  const defaultPasswrod = process.env.DEFUALT_USER_PASSWORD || "password123";
  const password = await bcrypt.hash(defaultPasswrod, 10);
  const fixed = FIXED_USERS.map((u) => ({ ...u, password }));

  const random = Array.from(
    { length: SEED_USERS - FIXED_USERS.length },
    () => ({
      email: faker.internet.email().toLowerCase(),
      name: faker.person.fullName(),
      password,
      role: faker.helpers.arrayElement(USER_ROLES),
    }),
  );

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
