import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import { generateIds, bulkInsert } from "./utils.js";

const SEED_USERS = 500;
const USER_ROLES = ["USER", "USER", "USER", "ADMIN", "MODERATOR"] as const;

export async function seedUsers(
  ctx: SeedContext,
  counts: SeedCounts,
): Promise<string[]> {
  console.log("Seeding users...");

  const hashedPassword = await bcrypt.hash(
    process.env.DEFAULT_USER_PASSWORD || "password123",
    10,
  );
  const ids = generateIds(SEED_USERS);

  await bulkInsert(
    ctx.pool,
    "users",
    ids.map((id, i) => {
      const email = faker.internet.email().toLowerCase();
      const [local, domain] = email.split("@");

      return {
        id,
        email: `${local}.${i}@${domain}`,
        name: faker.person.fullName(),
        age: faker.number.int({ min: 15, max: 30 }),
        password: hashedPassword,
        role: faker.helpers.arrayElement(USER_ROLES),
        updatedAt: new Date(),
      };
    }),
  );

  const profileIds = generateIds(ids.length);
  await bulkInsert(
    ctx.pool,
    "profiles",
    ids.map((uid, i) => ({
      id: profileIds[i],
      userId: uid,
      bio: faker.lorem.sentences(2),
      avatar: faker.image.avatar(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(true),
      updatedAt: new Date(),
    })),
  );

  counts.users = ids.length;
  counts.profiles = ids.length;
  console.log(`Created ${ids.length} users with profiles`);

  return ids;
}
