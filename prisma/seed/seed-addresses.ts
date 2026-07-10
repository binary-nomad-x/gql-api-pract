import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";

export async function seedAddresses(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
): Promise<void> {
  const data: {
    userId: string;
    label: string;
    street: string;
    addressLine2: string | null;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
    deliveryInstructions: string | null;
    latitude: number;
    longitude: number;
    isDefault: boolean;
    isBilling: boolean;
    contactName: string;
    contactPhone: string;
  }[] = [];

  for (const userId of userIds) {
    const addressCount = faker.number.int({ min: 2, max: 4 });
    for (let i = 0; i < addressCount; i++) {
      data.push({
        userId,
        label: i === 0 ? "Home" : i === 1 ? "Work" : i === 2 ? "Vacation Home" : "Other",
        street: faker.location.streetAddress(),
        addressLine2: Math.random() > 0.4 ? faker.location.secondaryAddress() : null,
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zip: faker.location.zipCode(),
        country: "US",
        phone: faker.phone.number(),
        deliveryInstructions: Math.random() > 0.5
          ? faker.helpers.arrayElement([
              "Leave at front door",
              "Ring bell twice",
              "Call upon arrival",
              "Leave with concierge",
            ])
          : null,
        latitude: parseFloat(faker.location.latitude()),
        longitude: parseFloat(faker.location.longitude()),
        isDefault: i === 0,
        isBilling: i === 0 || i === 1,
        contactName: faker.person.fullName(),
        contactPhone: faker.phone.number(),
      });
    }
  }

  await ctx.prisma.$transaction(
    data.map((d) => ctx.prisma.address.create({ data: d })),
  );
  counts.addresses += data.length;
}
