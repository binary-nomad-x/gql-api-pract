import type { PrismaClient } from "@prisma/client";

export class SavedPostService {
  constructor(private readonly core: PrismaClient) {}

  resolveSavedPostUser(userId: string) {
    return this.core.user.findUnique({ where: { id: userId } });
  }

  resolveSavedPostPost(postId: string) {
    return this.core.post.findUnique({ where: { id: postId } });
  }

  async toggleSavePost(userId: string, postId: string) {
    const existing = await this.core.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await this.core.savedPost.delete({ where: { id: existing.id } });
      return existing;
    }

    return this.core.savedPost.create({ data: { userId: userId!, postId } });
  }

  getMySavedPosts(userId: string, args: { limit?: number; offset?: number }) {
    return this.core.savedPost.findMany({
      where: { userId },
      take: args.limit ?? 20,
      skip: args.offset ?? 0,
      orderBy: { createdAt: "desc" },
    });
  }
}
