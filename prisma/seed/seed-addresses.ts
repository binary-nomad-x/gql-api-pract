import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts, AddressSeed } from "./types.js";

export async function seedAddresses(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
): Promise<void> {
  const data: AddressSeed[] = [];

  for (const userId of userIds) {
    const addressCount = faker.number.int({ min: 2, max: 4 });
    for (let i = 0; i < addressCount; i++) {
      data.push({
        userId,
        label: i === 0 ? "Home" : i === 1 ? "Work" : i === 2 ? "Vacation Home" : "Other",
        street: faker.location.streetAddress(),
        addressLine2: faker.location.secondaryAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zip: faker.location.zipCode(),
        country: "US",
        phone: faker.phone.number(),
        deliveryInstructions: faker.helpers.arrayElement([
          "Leave at front door", "Ring bell twice", "Call upon arrival",
          "Leave with concierge", "Fragile handle with care", "",
        ]),
        latitude: parseFloat(faker.location.latitude()),
        longitude: parseFloat(faker.location.longitude()),
        isDefault: i === 0,
        isBilling: i === 0 || i === 1,
        contactName: faker.person.fullName(),
        contactPhone: faker.phone.number(),
      });
    }
  }

  await ctx.prisma.address.createMany({ data });
  counts.addresses += data.length;
}
