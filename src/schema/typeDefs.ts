import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function load(file: string): string {
  return readFileSync(join(__dirname, file), "utf8");
}

export const typeDefs = [
  load("./types/base.graphql"),
  load("./types/user.graphql"),
  load("./types/profile.graphql"),
  load("./types/post.graphql"),
  load("./types/tag.graphql"),
  load("./types/category.graphql"),
  load("./types/comment.graphql"),
  load("./types/like.graphql"),
  load("./types/product.graphql"),
  load("./types/productImage.graphql"),
  load("./types/order.graphql"),
  load("./types/orderItem.graphql"),
  load("./types/payment.graphql"),
  load("./types/refund.graphql"),
  load("./types/review.graphql"),
  load("./types/address.graphql"),
  load("./types/wishlist.graphql"),
  load("./types/cart.graphql"),
  load("./types/coupon.graphql"),
  load("./types/shipment.graphql"),
  load("./types/notification.graphql"),
  load("./types/follow.graphql"),
  load("./types/savedPost.graphql"),
  load("./types/postView.graphql"),
  load("./types/subscription.graphql"),
  load("./types/discount.graphql"),
  load("./types/conversation.graphql"),
  load("./types/payload.graphql"),
  load("./types/stats.graphql"),
  load("./inputs.graphql"),
  load("./queries.graphql"),
  load("./mutations.graphql"),
  load("./fragments.graphql"),
].join("\n");
