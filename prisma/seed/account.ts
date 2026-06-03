import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User, Product } from "@prisma/client";

const WISHLIST_NAMES = ["Default", "Wishlist", "Favorites", "Gifts", "Dream Shopping"];

export async function seedAccountRelated(
  ctx: SeedContext,
  counts: SeedCounts,
  users: User[],
  products: Product[],
): Promise<void> {
  // Addresses — bulk insert
  const addressData: Array<{
    userId: string; label: string; street: string; city: string;
    state: string; zip: string; country: string; isDefault: boolean;
  }> = [];
  for (const user of users) {
    const numAddresses = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < numAddresses; i++) {
      addressData.push({
        userId: user.id,
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
  await ctx.prisma.address.createMany({ data: addressData });
  counts.addresses = addressData.length;

  // Wishlists — need IDs back for items, so create individually then query back
  const wishlistUsers = users.slice(0, 30);
  const wishlistData = wishlistUsers.map((u) => ({
    userId: u.id,
    name: faker.helpers.arrayElement(WISHLIST_NAMES),
  }));
  await ctx.prisma.wishlist.createMany({ data: wishlistData });
  const wishlists = await ctx.prisma.wishlist.findMany({
    where: { userId: { in: wishlistUsers.map((u) => u.id) } },
  });
  counts.wishlists = wishlists.length;

  // Wishlist items — bulk insert (ensure unique wishlistId + productId)
  const wlItemPairSet = new Set<string>();
  const wlItemData: Array<{ wishlistId: string; productId: string; note?: string }> = [];
  for (const wl of wishlists) {
    const numItems = faker.number.int({ min: 1, max: 5 });
    const wlProducts = faker.helpers.arrayElements(products, numItems);
    for (const p of wlProducts) {
      const key = `${wl.id}_${p.id}`;
      if (wlItemPairSet.has(key)) continue;
      wlItemPairSet.add(key);
      wlItemData.push({
        wishlistId: wl.id,
        productId: p.id,
        note: faker.helpers.maybe(() => faker.lorem.sentence()) ?? undefined,
      });
    }
  }
  await ctx.prisma.wishlistItem.createMany({ data: wlItemData });
  counts.wishlistItems = wlItemData.length;

  // Carts — need IDs back for items
  const cartUsers = users.slice(0, 40);
  const cartData = cartUsers.map((u) => ({ userId: u.id }));
  await ctx.prisma.cart.createMany({ data: cartData });
  const carts = await ctx.prisma.cart.findMany({
    where: { userId: { in: cartUsers.map((u) => u.id) } },
  });
  counts.carts = carts.length;

  // Cart items — bulk insert (ensure unique cartId + productId)
  const cartItemPairSet = new Set<string>();
  const cartItemData: Array<{ cartId: string; productId: string; quantity: number }> = [];
  for (const cart of carts) {
    const numItems = faker.number.int({ min: 1, max: 4 });
    const cartProducts = faker.helpers.arrayElements(products, numItems);
    for (const p of cartProducts) {
      const key = `${cart.id}_${p.id}`;
      if (cartItemPairSet.has(key)) continue;
      cartItemPairSet.add(key);
      cartItemData.push({ cartId: cart.id, productId: p.id, quantity: faker.number.int({ min: 1, max: 3 }) });
    }
  }
  await ctx.prisma.cartItem.createMany({ data: cartItemData });
  counts.cartItems = cartItemData.length;
}
