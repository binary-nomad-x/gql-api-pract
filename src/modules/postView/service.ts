import type { PrismaClient } from "@prisma/client";
import { BaseService } from "@gql-prisma-api/lib/BaseService.js";

export class PostViewService extends BaseService {
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
