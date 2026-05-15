import { Context } from "../context.js";

export const Query = {
  // Users
  users: async (_parent: unknown, _args: unknown, ctx: Context) => {
    return ctx.prisma.user.findMany({
      include: { profile: true, posts: true },
    });
  },

  user: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
    return ctx.prisma.user.findUnique({
      where: { id },
      include: { profile: true, posts: true },
    });
  },

  me: async (_parent: unknown, _args: unknown, ctx: Context) => {
    if (!ctx.userId) return null;
    return ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      include: { profile: true, posts: true },
    });
  },

  // Posts
  posts: async (
    _parent: unknown,
    {
      published,
      search,
      limit,
      offset,
    }: { published?: boolean; search?: string; limit: number; offset: number },
    ctx: Context,
  ) => {
    const where: any = {};
    if (published !== undefined) where.published = published;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }
    return ctx.prisma.post.findMany({
      where,
      take: limit,
      skip: offset,
      include: { author: true, tags: true },
      orderBy: { createdAt: "desc" },
    });
  },

  post: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
    return ctx.prisma.post.findUnique({
      where: { id },
      include: { author: true, tags: true },
    });
  },

  // Tags
  tags: async (_parent: unknown, _args: unknown, ctx: Context) => {
    return ctx.prisma.tag.findMany({ include: { posts: true } });
  },

  tag: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
    return ctx.prisma.tag.findUnique({
      where: { id },
      include: { posts: true },
    });
  },

  tagByName: async (
    _parent: unknown,
    { name }: { name: string },
    ctx: Context,
  ) => {
    return ctx.prisma.tag.findUnique({
      where: { name },
      include: { posts: true },
    });
  },

  // Categories
  categories: async (_parent: unknown, _args: unknown, ctx: Context) => {
    return ctx.prisma.category.findMany({ include: { posts: true, products: true } });
  },

  category: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
    return ctx.prisma.category.findUnique({
      where: { id },
      include: { posts: true, products: true },
    });
  },

  categoryBySlug: async (
    _parent: unknown,
    { slug }: { slug: string },
    ctx: Context,
  ) => {
    return ctx.prisma.category.findUnique({
      where: { slug },
      include: { posts: true, products: true },
    });
  },

  // Comments
  comments: async (
    _parent: unknown,
    { postId }: { postId: string },
    ctx: Context,
  ) => {
    return ctx.prisma.comment.findMany({
      where: { postId },
      include: { author: true, post: true },
      orderBy: { createdAt: "desc" },
    });
  },

  comment: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
    return ctx.prisma.comment.findUnique({
      where: { id },
      include: { author: true, post: true },
    });
  },

  // Likes
  likes: async (
    _parent: unknown,
    { postId }: { postId: string },
    ctx: Context,
  ) => {
    return ctx.prisma.like.findMany({
      where: { postId },
      include: { user: true, post: true },
    });
  },

  // Products
  products: async (
    _parent: unknown,
    {
      categorySlug,
      search,
      minPrice,
      maxPrice,
      limit,
      offset,
    }: {
      categorySlug?: string;
      search?: string;
      minPrice?: number;
      maxPrice?: number;
      limit: number;
      offset: number;
    },
    ctx: Context,
  ) => {
    const where: any = {};
    if (categorySlug) {
      where.category = { slug: categorySlug };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }
    return ctx.prisma.product.findMany({
      where,
      take: limit,
      skip: offset,
      include: { seller: true, category: true },
      orderBy: { createdAt: "desc" },
    });
  },

  product: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
    return ctx.prisma.product.findUnique({
      where: { id },
      include: { seller: true, category: true },
    });
  },

  productBySku: async (
    _parent: unknown,
    { sku }: { sku: string },
    ctx: Context,
  ) => {
    return ctx.prisma.product.findUnique({
      where: { sku },
      include: { seller: true, category: true },
    });
  },

  // Orders
  orders: async (
    _parent: unknown,
    {
      status,
      limit,
      offset,
    }: { status?: string; limit: number; offset: number },
    ctx: Context,
  ) => {
    if (!ctx.userId) return null;
    const where: any = { userId: ctx.userId };
    if (status) where.status = status;
    return ctx.prisma.order.findMany({
      where,
      take: limit,
      skip: offset,
      include: { items: { include: { product: true } }, payment: true },
      orderBy: { createdAt: "desc" },
    });
  },

  order: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
    if (!ctx.userId) return null;
    return ctx.prisma.order.findFirst({
      where: { id, userId: ctx.userId },
      include: { items: { include: { product: true } }, payment: true, refunds: true },
    });
  },

  // Payments
  payments: async (
    _parent: unknown,
    {
      status,
      limit,
      offset,
    }: { status?: string; limit: number; offset: number },
    ctx: Context,
  ) => {
    if (!ctx.userId) return null;
    const where: any = { order: { userId: ctx.userId } };
    if (status) where.status = status;
    return ctx.prisma.payment.findMany({
      where,
      take: limit,
      skip: offset,
      include: { order: true },
      orderBy: { createdAt: "desc" },
    });
  },

  payment: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
    if (!ctx.userId) return null;
    return ctx.prisma.payment.findFirst({
      where: { id, order: { userId: ctx.userId } },
      include: { order: true, refunds: true },
    });
  },

  // Refunds
  refunds: async (
    _parent: unknown,
    {
      status,
      limit,
      offset,
    }: { status?: string; limit: number; offset: number },
    ctx: Context,
  ) => {
    if (!ctx.userId) return null;
    const where: any = { order: { userId: ctx.userId } };
    if (status) where.status = status;
    return ctx.prisma.refund.findMany({
      where,
      take: limit,
      skip: offset,
      include: { payment: true, order: true },
      orderBy: { createdAt: "desc" },
    });
  },

  refund: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
    if (!ctx.userId) return null;
    return ctx.prisma.refund.findFirst({
      where: { id, order: { userId: ctx.userId } },
      include: { payment: true, order: true },
    });
  },

  // Reviews
  reviews: async (
    _parent: unknown,
    {
      productId,
      limit,
      offset,
    }: { productId: string; limit: number; offset: number },
    ctx: Context,
  ) => {
    return ctx.prisma.review.findMany({
      where: { productId },
      take: limit,
      skip: offset,
      include: { user: true, product: true },
      orderBy: { createdAt: "desc" },
    });
  },

  review: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
    return ctx.prisma.review.findUnique({
      where: { id },
      include: { user: true, product: true },
    });
  },

  // Stats
  stats: async (_parent: unknown, _args: unknown, ctx: Context) => {
    const [
      totalUsers,
      totalPosts,
      totalPublishedPosts,
      totalTags,
      totalCategories,
      totalComments,
      totalLikes,
      totalProducts,
      totalOrders,
      totalPayments,
      totalRefunds,
      totalReviews,
    ] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.post.count(),
      ctx.prisma.post.count({ where: { published: true } }),
      ctx.prisma.tag.count(),
      ctx.prisma.category.count(),
      ctx.prisma.comment.count(),
      ctx.prisma.like.count(),
      ctx.prisma.product.count(),
      ctx.prisma.order.count(),
      ctx.prisma.payment.count(),
      ctx.prisma.refund.count(),
      ctx.prisma.review.count(),
    ]);

    return {
      totalUsers,
      totalPosts,
      totalPublishedPosts,
      totalTags,
      totalCategories,
      totalComments,
      totalLikes,
      totalProducts,
      totalOrders,
      totalPayments,
      totalRefunds,
      totalReviews,
    };
  },
};
