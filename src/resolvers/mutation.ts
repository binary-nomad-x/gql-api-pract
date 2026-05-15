import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Context } from "../context.js";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const Mutation = {
  // Auth
  signup: async (_parent: unknown, { input }: any, ctx: Context) => {
    const { email, name, password } = input;
    const existingUser = await ctx.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error("User already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await ctx.prisma.user.create({
      data: { email, name, password: hashedPassword },
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    return { token, user };
  },

  login: async (_parent: unknown, { email, password }: any, ctx: Context) => {
    const user = await ctx.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not found");

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error("Invalid password");

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    return { token, user };
  },

  // Users
  updateUser: async (_parent: unknown, { id, input }: any, ctx: Context) => {
    if (ctx.userId !== id) throw new Error("Not authorized");

    const data: any = {};
    if (input.name) data.name = input.name;
    if (input.email) data.email = input.email;
    if (input.password) data.password = await bcrypt.hash(input.password, 10);
    return ctx.prisma.user.update({ where: { id }, data });
  },

  deleteUser: async (_parent: unknown, { id }: any, ctx: Context) => {
    if (ctx.userId !== id) throw new Error("Not authorized");
    await ctx.prisma.user.delete({ where: { id } });
    return true;
  },

  // Profile
  updateProfile: async (_parent: unknown, input: any, ctx: Context) => {
    if (!ctx.userId) throw new Error("Not authenticated");

    return ctx.prisma.profile.upsert({
      where: { userId: ctx.userId },
      update: input,
      create: { userId: ctx.userId, ...input },
    });
  },

  // Posts
  createPost: async (_parent: unknown, { input }: any, ctx: Context) => {
    if (!ctx.userId) throw new Error("Not authenticated");

    const { tags = [], categories: categorySlugs = [], ...postData } = input;

    return ctx.prisma.post.create({
      data: {
        ...postData,
        published: postData.published ?? false,
        authorId: ctx.userId,
        tags: {
          connectOrCreate: tags.map((tagName: string) => ({
            where: { name: tagName },
            create: { name: tagName },
          })),
        },
        categories: {
          connect: categorySlugs.map((slug: string) => ({ slug })),
        },
      },
      include: { tags: true, author: true, categories: true },
    });
  },

  updatePost: async (_parent: unknown, { id, input }: any, ctx: Context) => {
    const post = await ctx.prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    if (post.authorId !== ctx.userId) throw new Error("Not authorized");

    return ctx.prisma.post.update({
      where: { id },
      data: input,
      include: { tags: true, author: true },
    });
  },

  deletePost: async (_parent: unknown, { id }: any, ctx: Context) => {
    const post = await ctx.prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    if (post.authorId !== ctx.userId) throw new Error("Not authorized");

    await ctx.prisma.post.delete({ where: { id } });
    return true;
  },

  publishPost: async (_parent: unknown, { id }: any, ctx: Context) => {
    const post = await ctx.prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    if (post.authorId !== ctx.userId) throw new Error("Not authorized");

    return ctx.prisma.post.update({
      where: { id },
      data: { published: true },
      include: { tags: true, author: true },
    });
  },

  unpublishPost: async (_parent: unknown, { id }: any, ctx: Context) => {
    const post = await ctx.prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");
    if (post.authorId !== ctx.userId) throw new Error("Not authorized");

    return ctx.prisma.post.update({
      where: { id },
      data: { published: false },
      include: { tags: true, author: true },
    });
  },

  // Tags
  createTag: async (_parent: unknown, { name }: any, ctx: Context) => {
    return ctx.prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  },

  // Categories
  createCategory: async (_parent: unknown, { input }: any, ctx: Context) => {
    if (!ctx.userId) throw new Error("Not authenticated");

    return ctx.prisma.category.upsert({
      where: { slug: input.slug },
      update: { name: input.name, description: input.description },
      create: {
        name: input.name,
        slug: input.slug,
        description: input.description,
      },
    });
  },

  // Comments
  createComment: async (_parent: unknown, { input }: any, ctx: Context) => {
    if (!ctx.userId) throw new Error("Not authenticated");

    const post = await ctx.prisma.post.findUnique({
      where: { id: input.postId },
    });
    if (!post) throw new Error("Post not found");

    return ctx.prisma.comment.create({
      data: {
        content: input.content,
        authorId: ctx.userId,
        postId: input.postId,
      },
      include: { author: true, post: true },
    });
  },

  deleteComment: async (_parent: unknown, { id }: any, ctx: Context) => {
    if (!ctx.userId) throw new Error("Not authenticated");

    const comment = await ctx.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new Error("Comment not found");
    if (comment.authorId !== ctx.userId) throw new Error("Not authorized");

    await ctx.prisma.comment.delete({ where: { id } });
    return true;
  },

  // Likes
  toggleLike: async (_parent: unknown, { postId }: any, ctx: Context) => {
    if (!ctx.userId) throw new Error("Not authenticated");

    const existing = await ctx.prisma.like.findUnique({
      where: { userId_postId: { userId: ctx.userId, postId } },
    });

    if (existing) {
      await ctx.prisma.like.delete({ where: { id: existing.id } });
      return existing;
    }

    return ctx.prisma.like.create({
      data: { userId: ctx.userId, postId },
      include: { user: true, post: true },
    });
  },

  // Products
  createProduct: async (_parent: unknown, { input }: any, ctx: Context) => {
    if (!ctx.userId) throw new Error("Not authenticated");

    const { categorySlug, ...productData } = input;

    return ctx.prisma.product.create({
      data: {
        ...productData,
        sellerId: ctx.userId,
        ...(categorySlug
          ? { category: { connect: { slug: categorySlug } } }
          : {}),
      },
      include: { seller: true, category: true },
    });
  },

  updateProduct: async (_parent: unknown, { id, input }: any, ctx: Context) => {
    const product = await ctx.prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error("Product not found");
    if (product.sellerId !== ctx.userId) throw new Error("Not authorized");

    const { categorySlug, ...productData } = input;

    return ctx.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        ...(categorySlug !== undefined
          ? {
              category: categorySlug
                ? { connect: { slug: categorySlug } }
                : { disconnect: true },
            }
          : {}),
      },
      include: { seller: true, category: true },
    });
  },

  deleteProduct: async (_parent: unknown, { id }: any, ctx: Context) => {
    const product = await ctx.prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error("Product not found");
    if (product.sellerId !== ctx.userId) throw new Error("Not authorized");

    await ctx.prisma.product.delete({ where: { id } });
    return true;
  },

  // Orders
  placeOrder: async (_parent: unknown, { input }: any, ctx: Context) => {
    if (!ctx.userId) throw new Error("Not authenticated");

    const { items, shippingAddress } = input;

    const productIds = items.map((i: any) => i.productId);
    const products = await ctx.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p: any) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (!product.isActive) throw new Error(`Product ${product.name} is inactive`);
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }
    }

    let totalAmount = 0;
    const orderItems = items.map((item: any) => {
      const product = productMap.get(item.productId);
      const unitPrice = product.price;
      totalAmount += unitPrice * item.quantity;
      return { productId: item.productId, quantity: item.quantity, unitPrice };
    });

    const order = await ctx.prisma.$transaction(async (tx: any) => {
      const created = await tx.order.create({
        data: {
          userId: ctx.userId,
          totalAmount,
          shippingAddress,
          items: { create: orderItems },
        },
        include: { items: { include: { product: true } } },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return created;
    });

    return order;
  },

  cancelOrder: async (_parent: unknown, { id }: any, ctx: Context) => {
    if (!ctx.userId) throw new Error("Not authenticated");

    const order = await ctx.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new Error("Order not found");
    if (order.userId !== ctx.userId) throw new Error("Not authorized");
    if (order.status === "DELIVERED" || order.status === "SHIPPED") {
      throw new Error("Cannot cancel order that has been shipped or delivered");
    }

    const updated = await ctx.prisma.$transaction(async (tx: any) => {
      const result = await tx.order.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: { items: { include: { product: true } }, payment: true },
      });

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return result;
    });

    return updated;
  },

  updateOrderStatus: async (_parent: unknown, { id, status }: any, ctx: Context) => {
    if (!ctx.userId) throw new Error("Not authenticated");

    const order = await ctx.prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error("Order not found");
    if (order.userId !== ctx.userId) throw new Error("Not authorized");

    return ctx.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: { include: { product: true } }, payment: true },
    });
  },

  // Payments
  processPayment: async (_parent: unknown, { input }: any, ctx: Context) => {
    if (!ctx.userId) throw new Error("Not authenticated");

    const { orderId, method } = input;

    const order = await ctx.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");
    if (order.userId !== ctx.userId) throw new Error("Not authorized");

    const existingPayment = await ctx.prisma.payment.findUnique({
      where: { orderId },
    });
    if (existingPayment) throw new Error("Payment already exists for this order");

    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    return ctx.prisma.payment.create({
      data: {
        orderId,
        amount: order.totalAmount,
        method,
        status: "COMPLETED",
        transactionId,
      },
      include: { order: true },
    });
  },

  // Refunds
  createRefund: async (_parent: unknown, { input }: any, ctx: Context) => {
    if (!ctx.userId) throw new Error("Not authenticated");

    const { paymentId, orderId, amount, reason } = input;

    const payment = await ctx.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error("Payment not found");

    const order = await ctx.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");
    if (order.userId !== ctx.userId) throw new Error("Not authorized");

    return ctx.prisma.refund.create({
      data: { paymentId, orderId, amount, reason },
      include: { payment: true, order: true },
    });
  },

  updateRefundStatus: async (_parent: unknown, { id, status }: any, ctx: Context) => {
    if (!ctx.userId) throw new Error("Not authenticated");

    const refund = await ctx.prisma.refund.findUnique({
      where: { id },
      include: { order: true },
    });
    if (!refund) throw new Error("Refund not found");

    const refunded = await ctx.prisma.refund.update({
      where: { id },
      data: { status },
      include: { payment: true, order: true },
    });

    if (status === "COMPLETED") {
      const payment = await ctx.prisma.payment.findUnique({
        where: { id: refund.paymentId },
      });
      const allRefunded = await ctx.prisma.refund.findMany({
        where: { paymentId: refund.paymentId, status: "COMPLETED" },
      });
      const totalRefunded = allRefunded.reduce((s: number, r: any) => s + r.amount, 0);

      if (payment && totalRefunded >= payment.amount) {
        await ctx.prisma.payment.update({
          where: { id: payment.id },
          data: { status: "REFUNDED" },
        });
      }
    }

    return refunded;
  },

  // Reviews
  createReview: async (_parent: unknown, { input }: any, ctx: Context) => {
    if (!ctx.userId) throw new Error("Not authenticated");

    const { rating, title, content, productId } = input;
    if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");

    const product = await ctx.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new Error("Product not found");

    const existing = await ctx.prisma.review.findUnique({
      where: { productId_userId: { productId, userId: ctx.userId } },
    });
    if (existing) throw new Error("You have already reviewed this product");

    return ctx.prisma.review.create({
      data: { rating, title, content, productId, userId: ctx.userId },
      include: { user: true, product: true },
    });
  },

  deleteReview: async (_parent: unknown, { id }: any, ctx: Context) => {
    if (!ctx.userId) throw new Error("Not authenticated");

    const review = await ctx.prisma.review.findUnique({ where: { id } });
    if (!review) throw new Error("Review not found");
    if (review.userId !== ctx.userId) throw new Error("Not authorized");

    await ctx.prisma.review.delete({ where: { id } });
    return true;
  },
};
