import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import { generateIds, bulkInsert } from "./utils.js";

const WL_NAMES = ["Default", "Wishlist", "Favorites", "Gifts", "Dream Shopping"];

export async function seedAccountRelated(
  ctx: SeedContext,
  counts: SeedCounts,
  userIds: string[],
  productIds: string[],
): Promise<void> {
  // Addresses — pre-generate all IDs
  const addrCount = userIds.reduce((sum, uid) => sum + faker.number.int({ min: 1, max: 3 }), 0);
  const addrIds = generateIds(addrCount);
  const addrRows: Array<{
    id: string; userId: string; label: string; street: string; city: string;
    state: string; zip: string; country: string; isDefault: boolean;
  }> = [];
  let addrIdx = 0;
  for (const uid of userIds) {
    const n = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < n; i++) {
      addrRows.push({
        id: addrIds[addrIdx++],
        userId: uid,
        label: i === 0 ? "Home" : i === 1 ? "Work" : "Other",
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zip: faker.location.zipCode(),
        country: "US",
        isDefault: i === 0,
        updatedAt: new Date(),
      });
    }
  }
  await bulkInsert(ctx.pool, "addresses", addrRows, 500);
  counts.addresses = addrRows.length;

  // Wishlists
  const wlUsers = userIds.slice(0, 100);
  const wlIds = generateIds(wlUsers.length);
  await bulkInsert(ctx.pool, "wishlists", wlUsers.map((uid, i) => ({
    id: wlIds[i], userId: uid, name: faker.helpers.arrayElement(WL_NAMES),
    updatedAt: new Date(),
  })));
  counts.wishlists = wlIds.length;

  // Wishlist items
  const wlItemSet = new Set<string>();
  const wlItemRows: Array<{ wishlistId: string; productId: string; note?: string }> = [];
  for (const wlId of wlIds) {
    const items = faker.helpers.arrayElements(productIds, faker.number.int({ min: 1, max: 5 }));
    for (const pid of items) {
      const key = `${wlId}_${pid}`;
      if (wlItemSet.has(key)) continue;
      wlItemSet.add(key);
      wlItemRows.push({
        wishlistId: wlId,
        productId: pid,
        note: faker.helpers.maybe(() => faker.lorem.sentence()) ?? undefined,
      });
    }
  }
  const wlItemIds = generateIds(wlItemRows.length);
  await bulkInsert(ctx.pool, "wishlist_items", wlItemRows.map((d, i) => ({ id: wlItemIds[i], ...d })));

  counts.wishlistItems = wlItemRows.length;

  // Carts
  const cartUsers = userIds.slice(0, 150);
  const cartIds = generateIds(cartUsers.length);
  await bulkInsert(ctx.pool, "carts", cartUsers.map((uid, i) => ({
    id: cartIds[i], userId: uid,
    updatedAt: new Date(),
  })));
  counts.carts = cartIds.length;

  // Cart items
  const ciSet = new Set<string>();
  const ciRows: Array<{ cartId: string; productId: string; quantity: number }> = [];
  for (const cartId of cartIds) {
    const items = faker.helpers.arrayElements(productIds, faker.number.int({ min: 1, max: 4 }));
    for (const pid of items) {
      const key = `${cartId}_${pid}`;
      if (ciSet.has(key)) continue;
      ciSet.add(key);
      ciRows.push({ cartId, productId: pid, quantity: faker.number.int({ min: 1, max: 3 }) });
    }
  }
  const ciIds = generateIds(ciRows.length);
  await bulkInsert(ctx.pool, "cart_items", ciRows.map((d, i) => ({ id: ciIds[i], ...d })));
  counts.cartItems = ciRows.length;
}
