import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import { generateIds } from "./utils.js";

const SEED_USERS = 500;

const USER_ROLES = ["USER", "USER", "USER", "ADMIN", "MODERATOR"] as const;

export async function seedUsers(
  ctx: SeedContext,
  counts: SeedCounts,
): Promise<ReturnType<typeof generateIds>> {
  console.log("Seeding users...");

  const defaultPassword = process.env.DEFAULT_USER_PASSWORD || "password123";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  const ids = generateIds(SEED_USERS);

  const usersData = ids.map((id, index) => ({
    id,
    email: faker.internet.email().toLowerCase() + `.${index}`,
    name: faker.person.fullName(),
    password: hashedPassword,
    role: faker.helpers.arrayElement(USER_ROLES),
  }));

  await ctx.prisma.user.createMany({ data: usersData, skipDuplicates: true });

  await ctx.prisma.profile.createMany({
    data: ids.map((id) => ({
      userId: id,
      bio: faker.lorem.sentences(2),
      avatar: faker.image.avatar(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(true),
    })),
    skipDuplicates: true,
  });

  counts.users = usersData.length;
  counts.profiles = ids.length;
  console.log(`Created ${usersData.length} users with profiles`);

  return ids;
}
