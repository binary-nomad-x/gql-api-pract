import type { Context } from "../../types/context.js";
import { requireAuth } from "../../utils/errors.js";

export const WishlistResolver = {
  user: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.userId } }),
  items: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.wishlistItem.findMany({ where: { wishlistId: parent.id }, include: { product: true } }),
  itemCount: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.wishlistItem.count({ where: { wishlistId: parent.id } }),
};

export const WishlistItemResolver = {
  wishlist: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.wishlist.findUnique({ where: { id: parent.wishlistId } }),
  product: (parent: any, _args: unknown, ctx: Context) =>
    ctx.prisma.product.findUnique({ where: { id: parent.productId } }),
};

export const WishlistQueries = {
  myWishlists: (_parent: unknown, _args: unknown, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.wishlist.findMany({ where: { userId: ctx.userId! } });
  },
  wishlist: async (_parent: unknown, { id }: { id: string }, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.wishlist.findFirst({ where: { id, userId: ctx.userId! } });
  },
};

export const WishlistMutations = {
  createWishlist: async (_parent: unknown, { input }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.wishlist.create({ data: { ...input, userId: ctx.userId! } });
  },

  addToWishlist: async (_parent: unknown, { input }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const wishlist = await ctx.prisma.wishlist.findFirst({ where: { id: input.wishlistId, userId: ctx.userId! } });
    if (!wishlist) throw new Error("Wishlist not found");
    await ctx.prisma.wishlistItem.upsert({
      where: { wishlistId_productId: { wishlistId: input.wishlistId, productId: input.productId } },
      update: { note: input.note },
      create: { wishlistId: input.wishlistId, productId: input.productId, note: input.note },
    });
    return ctx.prisma.wishlist.findUnique({ where: { id: input.wishlistId } });
  },

  removeFromWishlist: async (_parent: unknown, { wishlistId, productId }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    const item = await ctx.prisma.wishlistItem.findUnique({
      where: { wishlistId_productId: { wishlistId, productId } },
    });
    if (item) await ctx.prisma.wishlistItem.delete({ where: { id: item.id } });
    return ctx.prisma.wishlist.findUnique({ where: { id: wishlistId } });
  },

  deleteWishlist: async (_parent: unknown, { id }: any, ctx: Context) => {
    requireAuth(ctx.userId);
    await ctx.prisma.wishlist.deleteMany({ where: { id, userId: ctx.userId! } });
    return true;
  },
};
