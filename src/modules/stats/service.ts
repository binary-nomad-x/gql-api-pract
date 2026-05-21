import type { PrismaClient } from "@prisma/client";

export async function getStats(prisma: PrismaClient) {
  const [
    totalUsers, totalPosts, totalPublishedPosts, totalTags, totalCategories,
    totalComments, totalLikes, totalProducts, totalOrders, totalPayments,
    totalRefunds, totalReviews, totalAddresses, totalWishlists, totalCarts,
    totalCoupons, totalShipments, totalNotifications, totalFollows,
    totalSavedPosts, totalPostViews,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.tag.count(),
    prisma.category.count(),
    prisma.comment.count(),
    prisma.like.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.payment.count(),
    prisma.refund.count(),
    prisma.review.count(),
    prisma.address.count(),
    prisma.wishlist.count(),
    prisma.cart.count(),
    prisma.coupon.count(),
    prisma.shipment.count(),
    prisma.notification.count(),
    prisma.follow.count(),
    prisma.savedPost.count(),
    prisma.postView.count(),
  ]);
  return {
    totalUsers, totalPosts, totalPublishedPosts, totalTags, totalCategories,
    totalComments, totalLikes, totalProducts, totalOrders, totalPayments,
    totalRefunds, totalReviews, totalAddresses, totalWishlists, totalCarts,
    totalCoupons, totalShipments, totalNotifications, totalFollows,
    totalSavedPosts, totalPostViews,
  };
}
