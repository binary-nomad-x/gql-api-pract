import type { Prisma } from "@prisma/client";
import type { CreateDiscountInput, UpdateDiscountInput } from "./inputs.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";
import { BaseService } from "@gql-prisma-api/lib/BaseService.js";

// --- Helper functions ---
function toDiscountCreate(input: CreateDiscountInput): Prisma.DiscountUncheckedCreateInput {
  return {
    productId: input.productId,
    name: input.name,
    type: input.type,
    value: input.value,
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
    maxUsage: input.maxUsage ?? 0,
  };
}

function toDiscountUpdate(input: UpdateDiscountInput): Prisma.DiscountUpdateInput {
  const data: Prisma.DiscountUpdateInput = {};
  if (input.name !== undefined && input.name !== null) data.name = input.name;
  if (input.value !== undefined && input.value !== null) data.value = input.value;
  if (input.startDate !== undefined && input.startDate !== null) data.startDate = new Date(input.startDate);
  if (input.endDate !== undefined && input.endDate !== null) data.endDate = new Date(input.endDate);
  if (input.isActive !== undefined && input.isActive !== null) data.isActive = input.isActive;
  if (input.maxUsage !== undefined && input.maxUsage !== null) data.maxUsage = input.maxUsage;
  return data;
}

export class DiscountService {
  constructor(private readonly base: BaseService) {}

  // --- Type-field resolver functions ---
  resolveDiscountProduct(productId: string) {
    return this.base.core.product.findUnique({ where: { id: productId } });
  }

  // --- Existing business logic functions ---
  async createDiscount(
    userId: string | undefined,
    input: CreateDiscountInput,
  ) {
    requireAuth(userId);
    const product = await this.base.core.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new Error("Product not found");
    return this.base.core.discount.create({ data: toDiscountCreate(input) });
  }

  async updateDiscount(
    userId: string | undefined,
    id: string,
    input: UpdateDiscountInput,
  ) {
    requireAuth(userId);
    return this.base.core.discount.update({ where: { id }, data: toDiscountUpdate(input) });
  }

  async deleteDiscount(
    userId: string | undefined,
    id: string,
  ) {
    requireAuth(userId);
    await this.base.core.discount.delete({ where: { id } });
    return true;
  }

  getActiveDiscounts() {
    const now = new Date();
    return this.base.core.discount.findMany({
      where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
      orderBy: { createdAt: "desc" },
    });
  }

  getProductDiscounts(productId: string) {
    const now = new Date();
    return this.base.core.discount.findMany({
      where: { productId, isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    });
  }
}
