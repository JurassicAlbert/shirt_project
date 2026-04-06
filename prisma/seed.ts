import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("AdminPass123", 10);
  await prisma.user.upsert({
    where: { email: "admin@shirt.local" },
    update: { passwordHash: adminHash, role: "admin" },
    create: {
      email: "admin@shirt.local",
      passwordHash: adminHash,
      role: "admin",
      termsAcceptedAt: new Date(),
    },
  });

  const supplier = await prisma.supplier.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Default Supplier",
      adapter: "local_supplier",
      isActive: true,
    },
  });

  const productData = [
    {
      id: "11111111-1111-1111-8111-111111111111",
      name: "Classic T-Shirt",
      slug: "classic-tshirt",
      type: "tshirt",
      description: "Soft cotton shirt for custom prints.",
      popularityScore: 120,
    },
    {
      id: "22222222-2222-2222-8222-222222222222",
      name: "Premium Hoodie",
      slug: "premium-hoodie",
      type: "hoodie",
      description: "Warm hoodie with front and back print area.",
      popularityScore: 95,
    },
    {
      id: "33333333-3333-3333-8333-333333333333",
      name: "Ceramic Mug",
      slug: "ceramic-mug",
      type: "mug",
      description: "11oz mug perfect for personalized gifts.",
      popularityScore: 80,
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      name: "Urban T-Shirt",
      slug: "urban-tshirt",
      type: "tshirt",
      description: "Street-fit tee for bold graphics and AI art.",
      popularityScore: 72,
    },
    {
      id: "55555555-5555-5555-8555-555555555555",
      name: "Oversized Hoodie",
      slug: "oversized-hoodie",
      type: "hoodie",
      description: "Relaxed silhouette with premium fleece interior.",
      popularityScore: 68,
    },
    {
      id: "66666666-6666-6666-8666-666666666666",
      name: "Enamel Camp Mug",
      slug: "enamel-mug",
      type: "mug",
      description: "Lightweight metal mug for outdoor branding.",
      popularityScore: 55,
    },
    {
      id: "77777777-7777-7777-8777-777777777777",
      name: "Vintage Wash Tee",
      slug: "vintage-tshirt",
      type: "tshirt",
      description: "Garment-dyed tee with retro hand-feel.",
      popularityScore: 62,
    },
    {
      id: "88888888-8888-8888-8888-888888888888",
      name: "Sport Tech Hoodie",
      slug: "sport-hoodie",
      type: "hoodie",
      description: "Performance blend with zip pocket and rib cuffs.",
      popularityScore: 58,
    },
  ];

  for (const product of productData) {
    const { popularityScore, ...rest } = product;
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        ...rest,
        popularityScore,
      },
      create: {
        ...rest,
        popularityScore,
        supplierId: supplier.id,
        vatRate: 23,
      },
    });
  }

  const variants = [
    { id: "a1111111-1111-1111-8111-111111111111", productId: productData[0].id, sku: "TSHIRT-BLK-M", size: "M", color: "black", material: "cotton", netPrice: 64.23, grossPrice: 79.0, stock: 100 },
    { id: "b2222222-2222-2222-8222-222222222222", productId: productData[1].id, sku: "HOODIE-NVY-L", size: "L", color: "navy", material: "cotton", netPrice: 129.27, grossPrice: 159.0, stock: 50 },
    { id: "c3333333-3333-3333-8333-333333333333", productId: productData[2].id, sku: "MUG-WHT-STD", size: "STD", color: "white", material: "ceramic", netPrice: 39.84, grossPrice: 49.0, stock: 200 },
    { id: "d4444444-4444-4444-8444-444444444444", productId: productData[3].id, sku: "TSHIRT-URB-S", size: "S", color: "charcoal", material: "cotton", netPrice: 56.1, grossPrice: 69.0, stock: 80 },
    { id: "e5555555-5555-5555-8555-555555555555", productId: productData[4].id, sku: "HOODIE-OVS-XL", size: "XL", color: "black", material: "fleece", netPrice: 145.53, grossPrice: 179.0, stock: 40 },
    { id: "f6666666-6666-6666-8666-666666666666", productId: productData[5].id, sku: "MUG-ENM-STD", size: "STD", color: "white", material: "enamel", netPrice: 48.78, grossPrice: 59.99, stock: 120 },
    { id: "g7777777-7777-7777-8777-777777777777", productId: productData[6].id, sku: "TSHIRT-VNT-M", size: "M", color: "sand", material: "cotton", netPrice: 60.16, grossPrice: 74.0, stock: 90 },
    { id: "h8888888-8888-8888-8888-888888888888", productId: productData[7].id, sku: "HOODIE-SPT-L", size: "L", color: "graphite", material: "poly-blend", netPrice: 113.82, grossPrice: 139.99, stock: 60 },
  ];

  for (const variant of variants) {
    await prisma.variant.upsert({
      where: { id: variant.id },
      update: variant,
      create: variant,
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
