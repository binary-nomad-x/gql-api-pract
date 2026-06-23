import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import { generateIds } from "./utils.js";

const WL_NAMES = ["Default", "Wishlist", "Favorites", "Gifts", "Dream Shopping"];

export async function seedAccountRelated(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  productIds: string[],
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
  for (const uid of userIds) {
    const n = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < n; i++) {
      addrData.push({
        userId: uid,
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

  // Wishlists — pre-generate IDs
  const wlUsers = userIds.slice(0, 100);
  const wlIds = generateIds(wlUsers.length);
  const wlData = wlUsers.map((uid, i) => ({
    id: wlIds[i],
    userId: uid,
    name: faker.helpers.arrayElement(WL_NAMES),
  }));
  await ctx.prisma.wishlist.createMany({ data: wlData });
  counts.wishlists = wlData.length;

  // Wishlist items
  const wlItemSet = new Set<string>();
  const wlItemData: Array<{ wishlistId: string; productId: string; note?: string }> = [];
  for (const wl of wlData) {
    const items = faker.helpers.arrayElements(productIds, faker.number.int({ min: 1, max: 5 }));
    for (const pid of items) {
      const key = `${wl.id}_${pid}`;
      if (wlItemSet.has(key)) continue;
      wlItemSet.add(key);
      wlItemData.push({
        wishlistId: wl.id,
        productId: pid,
        note: faker.helpers.maybe(() => faker.lorem.sentence()) ?? undefined,
      });
    }
  }
  await ctx.prisma.wishlistItem.createMany({ data: wlItemData });
  counts.wishlistItems = wlItemData.length;

  // Carts — pre-generate IDs
  const cartUsers = userIds.slice(0, 150);
  const cartIds = generateIds(cartUsers.length);
  const cartData = cartUsers.map((uid, i) => ({ id: cartIds[i], userId: uid }));
  await ctx.prisma.cart.createMany({ data: cartData });
  counts.carts = cartData.length;

  // Cart items
  const ciSet = new Set<string>();
  const ciData: Array<{ cartId: string; productId: string; quantity: number }> = [];
  for (const cart of cartData) {
    const items = faker.helpers.arrayElements(productIds, faker.number.int({ min: 1, max: 4 }));
    for (const pid of items) {
      const key = `${cart.id}_${pid}`;
      if (ciSet.has(key)) continue;
      ciSet.add(key);
      ciData.push({ cartId: cart.id, productId: pid, quantity: faker.number.int({ min: 1, max: 3 }) });
    }
  }
  await ctx.prisma.cartItem.createMany({ data: ciData });
  counts.cartItems = ciData.length;
}
