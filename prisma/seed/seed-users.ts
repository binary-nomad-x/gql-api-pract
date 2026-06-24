import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import type { SeedContext, SeedCounts } from "./types.js";

export async function seedUsers(
  ctx: SeedContext,
  counts: SeedCounts,
  count: number,
): Promise<string[]> {
  const passwordHash = bcrypt.hashSync("password123", 10);

  const userData = [
    {
      email: "alice@test.com",
      name: "Alice Johnson",
      role: "ADMIN",
      password: passwordHash,
    },
    {
      email: "bob@test.com",
      name: "Bob Smith",
      role: "USER",
      password: passwordHash,
    },
    {
      email: "charlie@test.com",
      name: "Charlie Brown",
      role: "USER",
      password: passwordHash,
    },
    {
      email: "diana@test.com",
      name: "Diana Prince",
      role: "MODERATOR",
      password: passwordHash,
    },
    {
      email: "eve@test.com",
      name: "Eve Adams",
      role: "USER",
      password: passwordHash,
    },
  ];

  for (let i = 0; i < count - 5; i++) {
    userData.push({
      email: faker.internet.email().toLowerCase(),
      name: faker.person.fullName(),
      role: "USER",
      password: passwordHash,
    });
  }

  const users = await Promise.all(
    userData.map((data) => ctx.prisma.user.create({ data })),
  );

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

  counts.users += users.length;
  counts.profiles += users.length;

  const userIds = users.map((u) => u.id);
  const testAccountEmails = userData.slice(0, 5).map((u) => u.email);
  console.log(
    `  Test accounts (password123): ${testAccountEmails.join(", ")}`,
  );

  return userIds;
}
