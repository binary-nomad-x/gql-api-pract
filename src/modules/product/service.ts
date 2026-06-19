import type { PrismaClient, Prisma } from "@prisma/client";
import type { CreateProductInput, UpdateProductInput, ProductFilterInput } from "./inputs.js";
import { requireAuth, requireOwner } from "@gql-prisma-api/utils/errors.js";

// --- Type-field resolver functions ---
export function resolveProductSeller(prisma: PrismaClient, productId: string) {
  return prisma.user.findUnique({ where: { id: productId } });
}

export function resolveProductCategory(prisma: PrismaClient, productId: string) {
  return prisma.category.findUnique({ where: { id: productId } });
}

export function resolveProductOrderItems(prisma: PrismaClient, productId: string) {
  return prisma.orderItem.findMany({ where: { productId } });
}

export function resolveProductReviews(prisma: PrismaClient, productId: string) {
  return prisma.review.findMany({ where: { productId } });
}

export function resolveProductImages(prisma: PrismaClient, productId: string) {
  return prisma.productImage.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
}

export function resolveProductWishlistItems(prisma: PrismaClient, productId: string) {
  return prisma.wishlistItem.findMany({ where: { productId } });
}

export function resolveProductReviewCount(prisma: PrismaClient, productId: string) {
  return prisma.review.count({ where: { productId } });
}

export async function resolveProductAverageRating(prisma: PrismaClient, productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
  });
  return agg._avg.rating;
}

// --- Existing business logic functions ---
export async function createProduct(
  prisma: PrismaClient,
  userId: string | undefined,
  input: CreateProductInput,
) {
  requireAuth(userId);
  const { categorySlug, ...data } = input;
  const { clean } = await import("@gql-prisma-api/utils/clean.js");
  const createData: Prisma.ProductCreateInput = clean({
    ...data,
    stock: input.stock ?? 0,
    sellerId: userId!,
    category: categorySlug ? { connect: { slug: categorySlug } } : undefined,
  }) as unknown as Prisma.ProductCreateInput;
  return prisma.product.create({ data: createData });
}

export async function updateProduct(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
  input: UpdateProductInput,
) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new Error("Product not found");
  requireOwner(product.sellerId, userId);
  const { categorySlug, ...data } = input;
  const { clean } = await import("@gql-prisma-api/utils/clean.js");
  const updateData: Prisma.ProductUpdateInput = clean({
    ...data,
    ...(categorySlug !== undefined
      ? {
          category: categorySlug
            ? { connect: { slug: categorySlug } }
            : { disconnect: true },
        }
      : {}),
  }) as unknown as Prisma.ProductUpdateInput;
  return prisma.product.update({ where: { id }, data: updateData });
}

export async function deleteProduct(
  prisma: PrismaClient,
  userId: string | undefined,
  id: string,
) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new Error("Product not found");
  requireOwner(product.sellerId, userId);
  await prisma.product.delete({ where: { id } });
  return true;
}

export function getProducts(
  prisma: PrismaClient,
  args: ProductFilterInput,
) {
  const conditions: Prisma.ProductWhereInput[] = [];

  if (args.categorySlug) {
    conditions.push({ category: { slug: args.categorySlug } });
  }

  if (args.search) {
    conditions.push({
      OR: [
        { name: { contains: args.search, mode: "insensitive" } },
        { description: { contains: args.search, mode: "insensitive" } },
      ],
    });
  }

  if (args.minPrice !== undefined || args.maxPrice !== undefined) {
    const priceFilter: Prisma.FloatFilter = {};
    if (args.minPrice !== undefined) priceFilter.gte = args.minPrice;
    if (args.maxPrice !== undefined) priceFilter.lte = args.maxPrice;
    conditions.push({ price: priceFilter });
  }

  const where: Prisma.ProductWhereInput = conditions.length > 0 ? { AND: conditions } : {};

  return prisma.product.findMany({
    where,
    take: args.limit ?? 20,
    skip: args.offset ?? 0,
    orderBy: { createdAt: "desc" },
  });
}

export function getProduct(prisma: PrismaClient, id: string) {
  return prisma.product.findUnique({ where: { id } });
}

export function getProductBySku(prisma: PrismaClient, sku: string) {
  return prisma.product.findUnique({ where: { sku } });
}
