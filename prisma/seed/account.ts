import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User, Product } from "@prisma/client";

const WL_NAMES = [
  "Default",
  "Wishlist",
  "Favorites",
  "Gifts",
  "Dream Shopping",
];

export async function seedAccountRelated(
  ctx: SeedContext,
  counts: SeedCounts,
  users: User[],
  products: Product[],
): Promise<void> {
  // Addresses
  const addrData: Array<{
    userId: string;
    label: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    isDefault: boolean;
  }> = [];
  for (const u of users) {
    const n = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < n; i++) {
      addrData.push({
        userId: u.id,
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
  await ctx.prisma.address.createMany({ data: addrData });
  counts.addresses = addrData.length;

  // Wishlists
  const wlUsers = users.slice(0, 100);
  await ctx.prisma.wishlist.createMany({
    data: wlUsers.map((u) => ({
      userId: u.id,
      name: faker.helpers.arrayElement(WL_NAMES),
    })),
  });

  const wishlists = await ctx.prisma.wishlist.findMany({
    where: { userId: { in: wlUsers.map((u) => u.id) } },
  });

  counts.wishlists = wishlists.length;

  const wlItemSet = new Set<string>();

  const wlItemData: Array<{
    wishlistId: string;
    productId: string;
    note?: string;
  }> = [];

  for (const wl of wishlists) {
    const items = faker.helpers.arrayElements(
      products,
      faker.number.int({ min: 1, max: 5 }),
    );
    for (const p of items) {
      const key = `${wl.id}_${p.id}`;
      if (wlItemSet.has(key)) continue;
      wlItemSet.add(key);
      wlItemData.push({
        wishlistId: wl.id,
        productId: p.id,
        note: faker.helpers.maybe(() => faker.lorem.sentence()) ?? undefined,
      });
    }
  }

  await ctx.prisma.wishlistItem.createMany({ data: wlItemData });
  counts.wishlistItems = wlItemData.length;

  // Carts
  const cartUsers = users.slice(0, 150);
  await ctx.prisma.cart.createMany({
    data: cartUsers.map((u) => ({ userId: u.id })),
  });
  const carts = await ctx.prisma.cart.findMany({
    where: { userId: { in: cartUsers.map((u) => u.id) } },
  });

  counts.carts = carts.length;

  const ciSet = new Set<string>();
  const ciData: Array<{ cartId: string; productId: string; quantity: number }> =
    [];

  for (const cart of carts) {
    const items = faker.helpers.arrayElements(
      products,
      faker.number.int({ min: 1, max: 4 }),
    );
    for (const p of items) {
      const key = `${cart.id}_${p.id}`;
      if (ciSet.has(key)) continue;
      ciSet.add(key);
      ciData.push({
        cartId: cart.id,
        productId: p.id,
        quantity: faker.number.int({ min: 1, max: 3 }),
      });
    }
  }

  await ctx.prisma.cartItem.createMany({ data: ciData });
  counts.cartItems = ciData.length;
}
