import type { PrismaClient } from "@prisma/client";

export class PostViewService {
  constructor(private readonly core: PrismaClient) {}
  resolvePostViewPost(postId: string) {
    return this.core.post.findUnique({ where: { id: postId } });
  }

  resolvePostViewUser(userId: string | null) {
    return userId ? this.core.user.findUnique({ where: { id: userId } }) : null;
  }

  recordPostView(
    postId: string,
    userId?: string,
  ) {
    return this.core.postView.create({ data: { postId, userId } });
  }
}
