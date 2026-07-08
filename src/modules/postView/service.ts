import type { PrismaClient } from "@prisma/client";
import { BaseService } from "@gql-prisma-api/lib/BaseService.js";

export class PostViewService {
  constructor(private readonly base: BaseService) {}
  resolvePostViewPost(postId: string) {
    return this.base.core.post.findUnique({ where: { id: postId } });
  }

  resolvePostViewUser(userId: string | null) {
    return userId ? this.base.core.user.findUnique({ where: { id: userId } }) : null;
  }

  recordPostView(
    postId: string,
    userId?: string,
  ) {
    return this.base.core.postView.create({ data: { postId, userId } });
  }
}
