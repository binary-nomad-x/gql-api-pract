import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SEED_USERS = 50;
const SEED_PRODUCTS = 500;
const SEED_ORDERS = 500;
const SEED_POSTS = 50;
const SEED_COMMENTS = 200;
const SEED_LIKES = 300;

async function main() {
  const flag = process.argv[2] || "";

  if (flag === "--reset" || flag === "-r") {
    await resetDatabase();
    console.log("Database reset complete.");
    return;
  }

  if (flag === "--fresh" || flag === "-f") {
    await resetDatabase();
    console.log("Database reset. Now seeding...");
  }

  console.log("Seeding database...\n");
  const start = Date.now();

  // ---- Users ----
  const password = await bcrypt.hash("password123", 10);
  const users: any[] = [];

  const fixedUsers = [
    { email: "alice@test.com", name: "Alice Johnson", role: "ADMIN" as const },
    { email: "bob@test.com", name: "Bob Smith", role: "USER" as const },
    { email: "charlie@test.com", name: "Charlie Brown", role: "USER" as const },
    {
      email: "diana@test.com",
      name: "Diana Prince",
      role: "MODERATOR" as const,
    },
    { email: "eve@test.com", name: "Eve Adams", role: "USER" as const },
  ];

  for (const u of fixedUsers) {
    users.push(await prisma.user.create({ data: { ...u, password } }));
  }

  for (let i = 0; i < SEED_USERS - fixedUsers.length; i++) {
    users.push(
      await prisma.user.create({
        data: {
          email: faker.internet.email().toLowerCase(),
          name: faker.person.fullName(),
          password,
          role: faker.helpers.arrayElement([
            "USER",
            "USER",
            "USER",
            "ADMIN",
            "MODERATOR",
          ] as const),
        },
      }),
    );
  }
  console.log(`Created ${users.length} users`);

  // ---- Profiles ----
  for (const user of users) {
    await prisma.profile.create({
      data: {
        userId: user.id,
        bio: faker.lorem.sentence(),
        avatar: faker.image.avatar(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
      },
    });
  }
  console.log(`Created ${users.length} profiles`);

  // ---- Categories ----
  const categoryData = [
    {
      name: "Technology",
      slug: "technology",
      description: "Tech, software, and gadgets",
    },
    { name: "Science", slug: "science", description: "Scientific discoveries" },
    { name: "Travel", slug: "travel", description: "Travel experiences" },
    { name: "Food", slug: "food", description: "Cooking and food culture" },
    { name: "Health", slug: "health", description: "Health and wellness" },
    { name: "Sports", slug: "sports", description: "Sports news and analysis" },
    {
      name: "Electronics",
      slug: "electronics",
      description: "Electronic devices and accessories",
    },
    { name: "Clothing", slug: "clothing", description: "Apparel and fashion" },
    {
      name: "Home & Garden",
      slug: "home-garden",
      description: "Home improvement and gardening",
    },
    { name: "Books", slug: "books", description: "Books and literature" },
  ];

  const categories: any[] = [];
  for (const c of categoryData) {
    categories.push(await prisma.category.create({ data: c }));
  }
  console.log(`Created ${categories.length} categories`);

  // ---- Tags ----
  const tagNames = [
    "javascript",
    "typescript",
    "graphql",
    "prisma",
    "react",
    "nodejs",
    "python",
    "ai",
    "database",
    "api",
    "webdev",
    "tutorial",
  ];
  const tags: any[] = [];
  for (const name of tagNames) {
    tags.push(await prisma.tag.create({ data: { name } }));
  }
  console.log(`Created ${tags.length} tags`);

  // ---- Posts ----
  const posts: any[] = [];
  for (let i = 0; i < SEED_POSTS; i++) {
    const postTags = faker.helpers.arrayElements(
      tags,
      faker.number.int({ min: 1, max: 4 }),
    );
    const postCategories = faker.helpers.arrayElements(
      categories.slice(0, 6),
      faker.number.int({ min: 1, max: 3 }),
    );
    posts.push(
      await prisma.post.create({
        data: {
          title: faker.lorem.sentence({ min: 5, max: 12 }),
          content: faker.lorem.paragraphs({ min: 3, max: 8 }),
          published: faker.datatype.boolean(0.7),
          authorId: faker.helpers.arrayElement(users).id,
          tags: { connect: postTags.map((t: any) => ({ id: t.id })) },
          categories: {
            connect: postCategories.map((c: any) => ({ id: c.id })),
          },
        },
      }),
    );
  }
  console.log(`Created ${posts.length} posts`);

  // ---- Comments ----
  for (let i = 0; i < SEED_COMMENTS; i++) {
    await prisma.comment.create({
      data: {
        content: faker.lorem.sentences({ min: 1, max: 3 }),
        authorId: faker.helpers.arrayElement(users).id,
        postId: faker.helpers.arrayElement(posts).id,
      },
    });
  }
  console.log(`Created ${SEED_COMMENTS} comments`);

  // ---- Likes ----
  const likePairs = new Set<string>();
  for (let i = 0; i < SEED_LIKES; i++) {
    const userId = faker.helpers.arrayElement(users).id;
    const postId = faker.helpers.arrayElement(posts).id;
    const key = `${userId}_${postId}`;
    if (likePairs.has(key)) continue;
    likePairs.add(key);
    await prisma.like.create({ data: { userId, postId } });
  }
  console.log(`Created ${likePairs.size} likes`);

  // ---- Products ----
  const productCatIds = categories.slice(6).map((c: any) => c.id);
  const allCategoryIds = categories.map((c: any) => c.id);
  const products: any[] = [];
  const usedSkus = new Set<string>();

  console.log("Seeding products...");
  for (let i = 0; i < SEED_PRODUCTS; i++) {
    let sku: string;
    do {
      sku = faker.string.alphanumeric({ length: 10, casing: "upper" });
    } while (usedSkus.has(sku));
    usedSkus.add(sku);

    products.push(
      await prisma.product.create({
        data: {
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          price: parseFloat(faker.commerce.price({ min: 5, max: 500 })),
          stock: faker.number.int({ min: 0, max: 200 }),
          sku,
          imageUrl: `https://picsum.photos/seed/${sku}/400/400`,
          isActive: faker.datatype.boolean(0.95),
          sellerId: faker.helpers.arrayElement(users).id,
          categoryId: faker.helpers.arrayElement(
            faker.datatype.boolean(0.7) ? productCatIds : allCategoryIds,
          ),
        },
      }),
    );

    if ((i + 1) % 100 === 0) console.log(`  ...${i + 1} products`);
  }
  console.log(`Created ${products.length} products`);

  // ---- Orders ----
  const orderStatuses = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ] as const;
  const orders: any[] = [];

  console.log("Seeding orders...");
  for (let i = 0; i < SEED_ORDERS; i++) {
    const buyer = faker.helpers.arrayElement(users);
    const numItems = faker.number.int({ min: 1, max: 6 });
    const orderProductIds = faker.helpers.arrayElements(products, numItems);
    const items = orderProductIds.map((p: any) => ({
      productId: p.id,
      quantity: faker.number.int({ min: 1, max: 4 }),
      unitPrice: p.price,
    }));
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.unitPrice * item.quantity,
      0,
    );

    const order = await prisma.order.create({
      data: {
        userId: buyer.id,
        status: faker.helpers.arrayElement(orderStatuses),
        totalAmount,
        shippingAddress: faker.location.streetAddress(),
        items: { create: items },
      },
      include: { items: true },
    });

    orders.push(order);
    if ((i + 1) % 100 === 0) console.log(`  ...${i + 1} orders`);
  }
  console.log(`Created ${orders.length} orders`);

  // ---- Decrement stock ----
  for (const order of orders) {
    if (order.status === "CANCELLED") continue;
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  }

  // ---- Payments ----
  const paymentMethods = [
    "CREDIT_CARD",
    "DEBIT_CARD",
    "PAYPAL",
    "BANK_TRANSFER",
    "CASH_ON_DELIVERY",
  ] as const;
  let paymentCount = 0;

  for (const order of orders) {
    if (order.status === "CANCELLED") continue;
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.totalAmount,
        method: faker.helpers.arrayElement(paymentMethods),
        status: faker.helpers.arrayElement([
          "COMPLETED",
          "COMPLETED",
          "COMPLETED",
          "FAILED",
          "REFUNDED",
        ] as const),
        transactionId: `TXN-${faker.string.alphanumeric({ length: 12, casing: "upper" })}`,
      },
    });
    paymentCount++;
  }

  // ---- Refunds ----
  const deliveredPayments = await prisma.payment.findMany({
    where: { status: "COMPLETED" },
    take: 100,
    orderBy: { createdAt: "desc" },
  });

  let refundCount = 0;
  for (const payment of deliveredPayments) {
    const refundAmount = parseFloat(
      faker.commerce.price({ min: 10, max: payment.amount }),
    );
    await prisma.refund.create({
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: Math.min(refundAmount, payment.amount),
        reason: faker.helpers.arrayElement([
          "Defective product",
          "Wrong item shipped",
          "Changed mind",
          "Item not as described",
          "Damaged during shipping",
        ]),
        status: faker.helpers.arrayElement([
          "PENDING",
          "APPROVED",
          "COMPLETED",
          "REJECTED",
        ] as const),
      },
    });
    refundCount++;
  }

  // ---- Reviews ----
  const reviewableProducts = faker.helpers.arrayElements(products, 400);
  let reviewCount = 0;
  for (const product of reviewableProducts) {
    const numReviews = faker.number.int({ min: 1, max: 5 });
    const reviewers = faker.helpers.arrayElements(users, numReviews);
    for (const reviewer of reviewers) {
      try {
        await prisma.review.create({
          data: {
            rating: faker.number.int({ min: 1, max: 5 }),
            title:
              faker.helpers.maybe(() =>
                faker.lorem.sentence({ min: 3, max: 8 }),
              ) ?? undefined,
            content:
              faker.helpers.maybe(() => faker.lorem.paragraph()) ?? undefined,
            productId: product.id,
            userId: reviewer.id,
          },
        });
        reviewCount++;
      } catch {
        // skip duplicate
      }
    }
  }

  // ---- Addresses ----
  let addressCount = 0;
  for (const user of users) {
    const numAddresses = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < numAddresses; i++) {
      await prisma.address.create({
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

  // ---- Wishlists ----
  let wishlistCount = 0;
  let wishlistItemCount = 0;
  for (const user of users.slice(0, 30)) {
    const wl = await prisma.wishlist.create({
      data: {
        userId: user.id,
        name: faker.helpers.arrayElement([
          "Default",
          "Wishlist",
          "Favorites",
          "Gifts",
          "Dream Shopping",
        ]),
      },
    });
    wishlistCount++;
    const numItems = faker.number.int({ min: 1, max: 5 });
    const wlProducts = faker.helpers.arrayElements(products, numItems);
    for (const p of wlProducts) {
      await prisma.wishlistItem.create({
        data: {
          wishlistId: wl.id,
          productId: p.id,
          note: faker.helpers.maybe(() => faker.lorem.sentence()) ?? undefined,
        },
      });
      wishlistItemCount++;
    }
  }

  // ---- Carts ----
  let cartCount = 0;
  let cartItemCount = 0;
  for (const user of users.slice(0, 40)) {
    const cart = await prisma.cart.create({ data: { userId: user.id } });
    cartCount++;
    const numItems = faker.number.int({ min: 1, max: 4 });
    const cartProducts = faker.helpers.arrayElements(products, numItems);
    for (const p of cartProducts) {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: p.id,
          quantity: faker.number.int({ min: 1, max: 3 }),
        },
      });
      cartItemCount++;
    }
  }

  // ---- Coupons ----
  const couponCodes = [
    "WELCOME10",
    "SAVE20",
    "FREESHIP",
    "HOLIDAY25",
    "FLASH50",
    "NEWUSER",
    "LOYALTY",
    "VIP15",
  ];
  let couponCount = 0;
  for (const code of couponCodes) {
    await prisma.coupon.create({
      data: {
        code,
        description: faker.lorem.sentence(),
        discountPercent: faker.helpers.arrayElement([0, 0, 10, 15, 20, 25, 50]),
        discountAmount: faker.helpers.arrayElement([0, 0, 5, 10, 25, 50, 100]),
        minPurchase: faker.helpers.arrayElement([0, 25, 50, 100]),
        maxUses: faker.number.int({ min: 50, max: 1000 }),
        isActive: true,
        expiresAt: faker.date.future(),
      },
    });
    couponCount++;
  }

  // ---- Shipments ----
  const carriers = ["UPS", "FedEx", "USPS", "DHL", "Amazon Logistics"];
  let shipmentCount = 0;
  const shippedOrders = orders.filter((o: any) =>
    ["SHIPPED", "DELIVERED"].includes(o.status),
  );
  for (const order of shippedOrders.slice(0, 200)) {
    await prisma.shipment.create({
      data: {
        orderId: order.id,
        carrier: faker.helpers.arrayElement(carriers),
        trackingNumber: faker.string.alphanumeric({
          length: 15,
          casing: "upper",
        }),
        status: faker.helpers.arrayElement([
          "PICKED_UP",
          "IN_TRANSIT",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
        ] as const),
        estimatedDelivery: faker.date.future(),
        deliveredAt: faker.datatype.boolean(0.4)
          ? faker.date.recent()
          : undefined,
      },
    });
    shipmentCount++;
  }

  // ---- Notifications ----
  const notifTypes = [
    "SYSTEM",
    "ORDER_UPDATE",
    "PAYMENT_RECEIVED",
    "SHIPMENT_UPDATE",
    "NEW_FOLLOWER",
    "NEW_COMMENT",
    "PROMOTION",
  ] as const;
  let notificationCount = 0;
  for (const user of users) {
    const numNotifs = faker.number.int({ min: 2, max: 8 });
    for (let i = 0; i < numNotifs; i++) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: faker.helpers.arrayElement(notifTypes),
          title: faker.lorem.sentence({ min: 3, max: 6 }),
          message:
            faker.helpers.maybe(() => faker.lorem.paragraph()) ?? undefined,
          link:
            faker.helpers.maybe(
              () =>
                "/" +
                faker.helpers.arrayElement(["orders", "posts", "products"]),
            ) ?? undefined,
          isRead: faker.datatype.boolean(0.5),
          readAt: faker.datatype.boolean(0.3) ? faker.date.recent() : undefined,
        },
      });
      notificationCount++;
    }
  }

  // ---- Follows ----
  let followCount = 0;
  const followPairs = new Set<string>();
  for (let i = 0; i < 150; i++) {
    const follower = faker.helpers.arrayElement(users);
    const following = faker.helpers.arrayElement(users);
    if (follower.id === following.id) continue;
    const key = `${follower.id}_${following.id}`;
    if (followPairs.has(key)) continue;
    followPairs.add(key);
    await prisma.follow.create({
      data: { followerId: follower.id, followingId: following.id },
    });
    followCount++;
  }

  // ---- SavedPosts ----
  let savedPostCount = 0;
  const savedPostPairs = new Set<string>();
  for (let i = 0; i < 200; i++) {
    const user = faker.helpers.arrayElement(users);
    const post = faker.helpers.arrayElement(posts);
    const key = `${user.id}_${post.id}`;
    if (savedPostPairs.has(key)) continue;
    savedPostPairs.add(key);
    await prisma.savedPost.create({
      data: { userId: user.id, postId: post.id },
    });
    savedPostCount++;
  }

  // ---- PostViews ----
  let postViewCount = 0;
  for (const post of posts) {
    const numViews = faker.number.int({ min: 5, max: 50 });
    for (let i = 0; i < numViews; i++) {
      await prisma.postView.create({
        data: {
          postId: post.id,
          userId: faker.datatype.boolean(0.7)
            ? faker.helpers.arrayElement(users).id
            : undefined,
          ip: faker.internet.ip(),
        },
      });
      postViewCount++;
    }
  }

  // ---- ProductImages ----
  let productImageCount = 0;
  for (const product of products) {
    const numImages = faker.number.int({ min: 1, max: 4 });
    for (let i = 0; i < numImages; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: `https://picsum.photos/seed/${product.sku}-${i}/400/400`,
          alt: `${product.name} - Image ${i + 1}`,
          sortOrder: i,
        },
      });
      productImageCount++;
    }
  }

  // ---- Summary ----
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Seeding complete in ${elapsed}s`);
  console.log(
    `Summary: ${users.length} users, ${products.length} products, ${orders.length} orders, ${reviewCount} reviews, ${notificationCount} notifications, ${postViewCount} post views`,
  );

  console.log(
    "\nTest accounts (password123): alice@test.com (ADMIN), bob@test.com (USER), charlie@test.com (USER), diana@test.com (MODERATOR), eve@test.com (USER)",
  );
}

async function resetDatabase() {
  console.log("Resetting database...");
  await prisma.$transaction([
    prisma.postView.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.savedPost.deleteMany(),
    prisma.follow.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.wishlist.deleteMany(),
    prisma.shipment.deleteMany(),
    prisma.refund.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.review.deleteMany(),
    prisma.product.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.address.deleteMany(),
    prisma.like.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.post.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
