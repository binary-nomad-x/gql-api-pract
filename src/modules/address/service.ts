import type { Prisma } from "@prisma/client";
import type { CreateAddressInput, UpdateAddressInput } from "./inputs.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";
import { unescape } from "querystring";
import { BaseService } from "@gql-prisma-api/lib/BaseService.js";

export class AddressService extends BaseService {
  // --- Type-field resolver functions ---
  resolveAddressUser(userId: string) {
    return this.core.user.findUnique({ where: { id: userId } });
  }

  // --- Existing business logic functions ---
  async createAddress(userId: string | undefined, input: CreateAddressInput) {
    requireAuth(userId);
    const { clean } = await import("@gql-prisma-api/utils/clean.js");
    const data: Prisma.AddressCreateInput = clean({
      ...input,
      userId: userId!,
      country: input.country ?? "US",
      label: input.label ?? "Home",
    }) as unknown as Prisma.AddressCreateInput;
    return this.core.address.create({ data });
  }

  async updateAddress(
    userId: string | undefined,
    id: string,
    input: UpdateAddressInput,
  ) {
    requireAuth(userId);

    const addr = await this.core.address.findFirst({
      where: { id, userId: userId! },
    });

    if (!addr) throw new Error("Address not found");
    return this.core.address.update({
      where: { id },
      data: {
        label: input?.label || undefined,
        street: input?.street || undefined,
        city: input.city || undefined,
        zip: input.zip || undefined,
        country: input.country || undefined,
        isDefault: input.isDefault || undefined,
      },
    });
  }

  async deleteAddress(userId: string | undefined, id: string) {
    requireAuth(userId);
    const addr = await this.core.address.findFirst({
      where: { id, userId: userId! },
    });
    if (!addr) throw new Error("Address not found");
    await this.core.address.delete({ where: { id } });
    return true;
  }

  async setDefaultAddress(userId: string | undefined, id: string) {
    requireAuth(userId);
    await this.core.address.updateMany({
      where: { userId: userId!, isDefault: true },
      data: { isDefault: false },
    });
    return this.core.address.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  getMyAddresses(userId: string | undefined) {
    requireAuth(userId);
    return this.core.address.findMany({ where: { userId: userId! } });
  }

  async getAddress(userId: string | undefined, id: string) {
    requireAuth(userId);
    return this.core.address.findFirst({ where: { id, userId: userId! } });
  }
}
