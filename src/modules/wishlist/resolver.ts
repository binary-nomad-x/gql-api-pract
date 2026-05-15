import type { Context } from "@graphql-prisma-api/types/context.js";
import type { Parent, IdArg } from "@graphql-prisma-api/types/graphql.js";
import type { CreateWishlistInput, AddToWishlistInput } from "@graphql-prisma-api/types/inputs.js";
import { requireAuth } from "@graphql-prisma-api/utils/errors.js";

export const WishlistResolver = {
  user: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.user.findUnique({ where: { id: parent.userId as string } }),
  items: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.wishlistItem.findMany({ where: { wishlistId: parent.id }, include: { product: true } }),
  itemCount: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.wishlistItem.count({ where: { wishlistId: parent.id } }),
};

export const WishlistItemResolver = {
  wishlist: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.wishlist.findUnique({ where: { id: parent.wishlistId as string } }),
  product: (parent: Parent, _args: unknown, ctx: Context) =>
    ctx.prisma.product.findUnique({ where: { id: parent.productId as string } }),
};

export const WishlistQueries = {
  myWishlists: (_parent: unknown, _args: unknown, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.wishlist.findMany({ where: { userId: ctx.userId! } });
  },

  wishlist: async (_parent: unknown, { id }: IdArg, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.wishlist.findFirst({ where: { id, userId: ctx.userId! } });
  },
};

export const WishlistMutations = {
  createWishlist: async (_parent: unknown, { input }: { input: CreateWishlistInput }, ctx: Context) => {
    requireAuth(ctx.userId);
    return ctx.prisma.wishlist.create({ data: { name: input.name ?? "Default", userId: ctx.userId! } });
  },

  addToWishlist: async (_parent: unknown, { input }: { input: AddToWishlistInput }, ctx: Context) => {
    requireAuth(ctx.userId);
    const wishlist = await ctx.prisma.wishlist.findFirst({
      where: { id: input.wishlistId, userId: ctx.userId! },
    });
    if (!wishlist) throw new Error("Wishlist not found");

    await ctx.prisma.wishlistItem.upsert({
      where: { wishlistId_productId: { wishlistId: input.wishlistId, productId: input.productId } },
      update: { note: input.note ?? null },
      create: { wishlistId: input.wishlistId, productId: input.productId, note: input.note ?? null },
    });
    return ctx.prisma.wishlist.findUnique({ where: { id: input.wishlistId } });
  },

  removeFromWishlist: async (_parent: unknown, args: { wishlistId: string; productId: string }, ctx: Context) => {
    requireAuth(ctx.userId);
    const item = await ctx.prisma.wishlistItem.findUnique({
      where: { wishlistId_productId: { wishlistId: args.wishlistId, productId: args.productId } },
    });
    if (item) await ctx.prisma.wishlistItem.delete({ where: { id: item.id } });
    return ctx.prisma.wishlist.findUnique({ where: { id: args.wishlistId } });
  },

  deleteWishlist: async (_parent: unknown, { id }: IdArg, ctx: Context) => {
    requireAuth(ctx.userId);
    await ctx.prisma.wishlist.deleteMany({ where: { id, userId: ctx.userId! } });
    return true;
  },
};
