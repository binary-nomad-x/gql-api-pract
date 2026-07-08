import type { Prisma } from "@prisma/client";
import type { UpdateUserInput, UpdateProfileInput } from "./inputs.js";
import { hashPassword } from "@gql-prisma-api/utils/auth.js";
import { requireAuth, requireOwner } from "@gql-prisma-api/utils/errors.js";
import { BaseService } from "@gql-prisma-api/lib/BaseService.js";

export class UserService {
  constructor(private readonly base: BaseService) {}

  resolveUserProfile(userId: string) {
    return this.base.core.profile.findUnique({ where: { userId } });
  }
  resolveUserPosts(userId: string) {
    return this.base.core.post.findMany({ where: { authorId: userId } });
  }
  resolveUserComments(userId: string) {
    return this.base.core.comment.findMany({ where: { authorId: userId } });
  }
  resolveUserLikes(userId: string) {
    return this.base.core.like.findMany({ where: { userId } });
  }
  resolveUserProducts(userId: string) {
    return this.base.core.product.findMany({ where: { sellerId: userId } });
  }
  resolveUserOrders(userId: string) {
    return this.base.core.order.findMany({ where: { userId } });
  }
  resolveUserReviews(userId: string) {
    return this.base.core.review.findMany({ where: { userId } });
  }
  resolveUserAddresses(userId: string) {
    return this.base.core.address.findMany({ where: { userId } });
  }
  resolveUserWishlists(userId: string) {
    return this.base.core.wishlist.findMany({ where: { userId } });
  }
  resolveUserCart(userId: string) {
    return this.base.core.cart.findUnique({ where: { userId } });
  }
  resolveUserNotifications(userId: string) {
    return this.base.core.notification.findMany({ where: { userId } });
  }
  resolveUserFollowers(userId: string) {
    return this.base.core.follow.findMany({ where: { followingId: userId } });
  }
  resolveUserFollowing(userId: string) {
    return this.base.core.follow.findMany({ where: { followerId: userId } });
  }
  resolveUserSavedPosts(userId: string) {
    return this.base.core.savedPost.findMany({ where: { userId } });
  }
  resolveUserPostViews(userId: string) {
    return this.base.core.postView.findMany({ where: { userId } });
  }

  async updateUser(
    userId: string | undefined,
    args: { id: string; input: UpdateUserInput },
  ) {
    requireOwner(args.id, userId);
    const data: Prisma.UserUpdateInput = {};
    const { name, email, password } = args.input;
    if (name) data.name = name;
    if (email) data.email = email;
    if (password) data.password = await hashPassword(password);
    return this.base.core.user.update({ where: { id: args.id }, data });
  }

  async deleteUser(
    userId: string | undefined,
    id: string,
  ) {
    requireOwner(id, userId);
    await this.base.core.user.delete({ where: { id } });
    return true;
  }

  async updateProfile(
    userId: string | undefined,
    input: UpdateProfileInput,
  ) {
    requireAuth(userId);
    const { clean } = await import("@gql-prisma-api/utils/clean.js");
    const data: Prisma.ProfileUpdateInput = clean(
      input as unknown as Record<string, unknown>,
    ) as Prisma.ProfileUpdateInput;
    return this.base.core.profile.upsert({
      where: { userId: userId! },
      update: data,
      create: { userId: userId!, ...data } as Prisma.ProfileCreateInput,
    });
  }

  getUsers() {
    return this.base.core.user.findMany();
  }

  getUser(id: string) {
    return this.base.core.user.findUnique({ where: { id } });
  }

  getMe(userId?: string) {
    if (!userId) return null;
    return this.base.core.user.findUnique({ where: { id: userId } });
  }
}
