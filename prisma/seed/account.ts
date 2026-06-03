import { faker } from "@faker-js/faker";
import type { SeedContext, SeedCounts } from "./types.js";
import type { User, Product } from "@prisma/client";

/**
 * Seed addresses for every user, plus wishlists (first 30 users) and carts (first 40 users).
 */
export async function seedAccountRelated(
  ctx: SeedContext,
  counts: SeedCounts,
  users: User[],
  products: Product[],
): Promise<void> {
  // Addresses: 1-3 per user
  let addressCount = 0;
  for (const user of users) {
    const numAddresses = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < numAddresses; i++) {
      await ctx.prisma.address.create({
        data: {
          userId: user.id,
          label: i === 0 ? "Home" : i === 1 ? "Work" : "Other",
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state({ abbreviated: true }),
          zip: faker.location.zipCode(),
          country: "US",
          isDefault: i === 0,
        },
      });
      addressCount++;
    }
  }
  counts.addresses = addressCount;

  // Wishlists: first 30 users, 1-5 items each
  let wishlistCount = 0;
  let wishlistItemCount = 0;
  const wishlistNames = ["Default", "Wishlist", "Favorites", "Gifts", "Dream Shopping"];

  for (const user of users.slice(0, 30)) {
    const wl = await ctx.prisma.wishlist.create({
      data: { userId: user.id, name: faker.helpers.arrayElement(wishlistNames) },
    });
    wishlistCount++;

    const numItems = faker.number.int({ min: 1, max: 5 });
    const wlProducts = faker.helpers.arrayElements(products, numItems);
    for (const p of wlProducts) {
      await ctx.prisma.wishlistItem.create({
        data: {
          wishlistId: wl.id,
          productId: p.id,
          note: faker.helpers.maybe(() => faker.lorem.sentence()) ?? undefined,
        },
      });
      wishlistItemCount++;
    }
  }
  counts.wishlists = wishlistCount;
  counts.wishlistItems = wishlistItemCount;

  // Carts: first 40 users, 1-4 items each
  let cartCount = 0;
  let cartItemCount = 0;
  for (const user of users.slice(0, 40)) {
    const cart = await ctx.prisma.cart.create({ data: { userId: user.id } });
    cartCount++;

    const numItems = faker.number.int({ min: 1, max: 4 });
    const cartProducts = faker.helpers.arrayElements(products, numItems);
    for (const p of cartProducts) {
      await ctx.prisma.cartItem.create({
        data: { cartId: cart.id, productId: p.id, quantity: faker.number.int({ min: 1, max: 3 }) },
      });
      cartItemCount++;
    }
  }
  counts.carts = cartCount;
  counts.cartItems = cartItemCount;
}
