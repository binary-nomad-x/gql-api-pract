import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

export async function seedAddresses(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
): Promise<void> {
  const data: Array<{
    userId: string;
    label: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    isDefault: boolean;
  }> = [];

  for (const userId of userIds) {
    const addressCount = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < addressCount; i++) {
      data.push({
        userId,
        label: i === 0 ? "Home" : i === 1 ? "Work" : "Other",
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zip: faker.location.zipCode(),
        country: "US",
        isDefault: i === 0,
      });
    }
  }

  await ctx.prisma.address.createMany({ data });
  counts.addresses += data.length;
}
