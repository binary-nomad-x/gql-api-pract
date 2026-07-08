import type { PrismaClient } from "@prisma/client";
import { BaseService } from "@gql-prisma-api/lib/BaseService.js";
import { requireAuth } from "@gql-prisma-api/utils/errors.js";

export class SavedPostService extends BaseService {
  resolveSavedPostUser(userId: string) {
    return this.core.user.findUnique({ where: { id: userId } });
  }

  resolveSavedPostPost(postId: string) {
    return this.core.post.findUnique({ where: { id: postId } });
  }

  async toggleSavePost(
    userId: string | undefined,
    postId: string,
  ) {
    requireAuth(userId);
    const existing = await this.core.savedPost.findUnique({
      where: { userId_postId: { userId: userId!, postId } },
    });
    if (existing) {
      await this.core.savedPost.delete({ where: { id: existing.id } });
      return existing;
    }
    return this.core.savedPost.create({ data: { userId: userId!, postId } });
  }

  getMySavedPosts(
    userId: string | undefined,
    args: { limit?: number; offset?: number },
  ) {
    requireAuth(userId);
    return this.core.savedPost.findMany({
      where: { userId: userId! },
      take: args.limit ?? 20,
      skip: args.offset ?? 0,
      orderBy: { createdAt: "desc" },
    });
  }
}
