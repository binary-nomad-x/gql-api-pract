import type { PrismaClient } from "@prisma/client";
import { BaseService } from "@gql-prisma-api/lib/BaseService.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";

export class SavedPostService {
  constructor(private readonly base: BaseService) {}
  resolveSavedPostUser(userId: string) {
    return this.base.core.user.findUnique({ where: { id: userId } });
  }

  resolveSavedPostPost(postId: string) {
    return this.base.core.post.findUnique({ where: { id: postId } });
  }

  async toggleSavePost(
    userId: string | undefined,
    postId: string,
  ) {
    requireAuth(userId);
    const existing = await this.base.core.savedPost.findUnique({
      where: { userId_postId: { userId: userId!, postId } },
    });
    if (existing) {
      await this.base.core.savedPost.delete({ where: { id: existing.id } });
      return existing;
    }
    return this.base.core.savedPost.create({ data: { userId: userId!, postId } });
  }

  getMySavedPosts(
    userId: string | undefined,
    args: { limit?: number; offset?: number },
  ) {
    requireAuth(userId);
    return this.base.core.savedPost.findMany({
      where: { userId: userId! },
      take: args.limit ?? 20,
      skip: args.offset ?? 0,
      orderBy: { createdAt: "desc" },
    });
  }
}
