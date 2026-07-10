import type { SeedContext, SeedCounts } from "./types.js";

const CATEGORY_DATA = [
  { name: "Electronics", slug: "electronics", description: "Gadgets, devices, and tech accessories" },
  { name: "Clothing", slug: "clothing", description: "Apparel, footwear, and accessories" },
  { name: "Books", slug: "books", description: "Fiction, non-fiction, and educational" },
  { name: "Home & Kitchen", slug: "home-kitchen", description: "Furniture, decor, and kitchenware" },
  { name: "Sports & Outdoors", slug: "sports-outdoors", description: "Sports equipment and outdoor gear" },
  { name: "Beauty & Health", slug: "beauty-health", description: "Skincare, cosmetics, and wellness" },
  { name: "Toys & Games", slug: "toys-games", description: "Toys, board games, and puzzles" },
  { name: "Automotive", slug: "automotive", description: "Car parts, accessories, and tools" },
  { name: "Groceries", slug: "groceries", description: "Daily essentials, beverages, and packaged foods" },
  { name: "Pet Supplies", slug: "pet-supplies", description: "Food, toys, and accessories for pets" },
  { name: "Jewelry", slug: "jewelry", description: "Rings, necklaces, bracelets, and watches" },
  { name: "Office Supplies", slug: "office-supplies", description: "Stationery, office furniture, and equipment" },
  { name: "Baby Products", slug: "baby-products", description: "Diapers, strollers, toys, and baby care" },
  { name: "Garden & Outdoor", slug: "garden-outdoor", description: "Gardening tools, plants, and outdoor furniture" },
  { name: "Music & Instruments", slug: "music-instruments", description: "Musical instruments and audio accessories" },
  { name: "Arts & Crafts", slug: "arts-crafts", description: "Craft supplies, painting, and DIY materials" },
  { name: "Industrial & Scientific", slug: "industrial-scientific", description: "Professional tools and laboratory equipment" },
  { name: "Software", slug: "software", description: "Operating systems, productivity, and creative software" },
  { name: "Video Games", slug: "video-games", description: "Gaming consoles, games, and accessories" },
  { name: "Mobile Phones", slug: "mobile-phones", description: "Smartphones, accessories, and wearables" },
  { name: "Laptops & Computers", slug: "laptops-computers", description: "Laptops, desktops, monitors, and peripherals" },
  { name: "Cameras & Photography", slug: "cameras-photography", description: "Cameras, lenses, drones, and accessories" },
  { name: "Furniture", slug: "furniture", description: "Home and office furniture for every space" },
  { name: "Appliances", slug: "appliances", description: "Kitchen and home appliances" },
  { name: "Travel & Luggage", slug: "travel-luggage", description: "Suitcases, backpacks, and travel accessories" },
  { name: "Watches", slug: "watches", description: "Luxury, smart, and casual watches" },
  { name: "Shoes", slug: "shoes", description: "Men's, women's, and children's footwear" },
  { name: "Bags & Accessories", slug: "bags-accessories", description: "Handbags, wallets, belts, and backpacks" },
  { name: "Jewelry & Accessories", slug: "jewelry-accessories", description: "Fashion and fine jewelry collections" },
  { name: "Medical Supplies", slug: "medical-supplies", description: "Healthcare devices and medical essentials" },
  { name: "Fitness Equipment", slug: "fitness-equipment", description: "Gym machines, weights, and fitness accessories" },
  { name: "Smart Home", slug: "smart-home", description: "Home automation, security, and smart devices" },
  { name: "Party Supplies", slug: "party-supplies", description: "Decorations, balloons, and celebration essentials" },
  { name: "Gift Cards", slug: "gift-cards", description: "Digital and physical gift cards for popular brands" },
];

export async function seedCategories(
  ctx: SeedContext,
  counts: SeedCounts,
): Promise<string[]> {

  const categories = await Promise.all(
    CATEGORY_DATA.map((data) => ctx.prisma.category.create({ data })),
  );

  counts.categories += categories.length;
  return categories.map((c) => c.id);

}
