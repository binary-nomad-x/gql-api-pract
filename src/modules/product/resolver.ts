import type { Context } from "@gql-prisma-api/types/context.js";
import type { Product as ProductModel } from "@prisma/client";
import type { CreateProductInput, UpdateProductInput, ProductFilterInput } from "./inputs.js";
import {
  resolveProductSeller,
  resolveProductCategory,
  resolveProductOrderItems,
  resolveProductReviews,
  resolveProductImages,
  resolveProductWishlistItems,
  resolveProductReviewCount,
  resolveProductAverageRating,
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProduct,
  getProductBySku,
} from "./service.js";

export const Product = {
  seller: (parent: ProductModel, _args: unknown, ctx: Context) =>
    resolveProductSeller(ctx.prisma, parent.sellerId),
  category: (parent: ProductModel, _args: unknown, ctx: Context) =>
    parent.categoryId
      ? resolveProductCategory(ctx.prisma, parent.categoryId)
      : null,
  orderItems: (parent: ProductModel, _args: unknown, ctx: Context) =>
    resolveProductOrderItems(ctx.prisma, parent.id),
  reviews: (parent: ProductModel, _args: unknown, ctx: Context) =>
    resolveProductReviews(ctx.prisma, parent.id),
  images: (parent: ProductModel, _args: unknown, ctx: Context) =>
    resolveProductImages(ctx.prisma, parent.id),
  wishlistItems: (parent: ProductModel, _args: unknown, ctx: Context) =>
    resolveProductWishlistItems(ctx.prisma, parent.id),
  reviewCount: (parent: ProductModel, _args: unknown, ctx: Context) =>
    resolveProductReviewCount(ctx.prisma, parent.id),
  averageRating: (parent: ProductModel, _args: unknown, ctx: Context) =>
    resolveProductAverageRating(ctx.prisma, parent.id),
};

export const Query = {
  products: async (_parent: unknown, args: ProductFilterInput, ctx: Context) =>
    getProducts(ctx.prisma, args),
  product: (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    getProduct(ctx.prisma, id),
  productBySku: (_parent: unknown, { sku }: { sku: string }, ctx: Context) =>
    getProductBySku(ctx.prisma, sku),
};

export const Mutation = {
  createProduct: async (
    _parent: unknown,
    { input }: { input: CreateProductInput },
    ctx: Context,
  ) => createProduct(ctx.prisma, ctx.userId, input),

  updateProduct: async (
    _parent: unknown,
    { id, input }: { id: string; input: UpdateProductInput },
    ctx: Context,
  ) => updateProduct(ctx.prisma, ctx.userId, id, input),

  deleteProduct: async (_parent: unknown, { id }: { id: string }, ctx: Context) =>
    deleteProduct(ctx.prisma, ctx.userId, id),
};
