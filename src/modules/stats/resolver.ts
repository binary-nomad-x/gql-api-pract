import type { Context } from "@graphql-prisma-api/types/context.js";

export const StatsQueries = {
  stats: async (_parent: unknown, _args: unknown, ctx: Context) => {
    const [
      totalUsers, totalPosts, totalPublishedPosts, totalTags, totalCategories,
      totalComments, totalLikes, totalProducts, totalOrders, totalPayments,
      totalRefunds, totalReviews, totalAddresses, totalWishlists, totalCarts,
      totalCoupons, totalShipments, totalNotifications, totalFollows,
      totalSavedPosts, totalPostViews,
    ] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.post.count(),
      ctx.prisma.post.count({ where: { published: true } }),
      ctx.prisma.tag.count(),
      ctx.prisma.category.count(),
      ctx.prisma.comment.count(),
      ctx.prisma.like.count(),
      ctx.prisma.product.count(),
      ctx.prisma.order.count(),
      ctx.prisma.payment.count(),
      ctx.prisma.refund.count(),
      ctx.prisma.review.count(),
      ctx.prisma.address.count(),
      ctx.prisma.wishlist.count(),
      ctx.prisma.cart.count(),
      ctx.prisma.coupon.count(),
      ctx.prisma.shipment.count(),
      ctx.prisma.notification.count(),
      ctx.prisma.follow.count(),
      ctx.prisma.savedPost.count(),
      ctx.prisma.postView.count(),
    ]);
    return {
      totalUsers, totalPosts, totalPublishedPosts, totalTags, totalCategories,
      totalComments, totalLikes, totalProducts, totalOrders, totalPayments,
      totalRefunds, totalReviews, totalAddresses, totalWishlists, totalCarts,
      totalCoupons, totalShipments, totalNotifications, totalFollows,
      totalSavedPosts, totalPostViews,
    };
  },
};
