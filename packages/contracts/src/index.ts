import { z } from "zod";

export const roleSchema = z.enum(["customer", "admin", "moderator"]);
export const productTypeSchema = z.enum(["tshirt", "hoodie", "mug"]);
export const styleSchema = z.enum(["minimal", "vintage", "modern", "funny", "custom"]);

export const searchQuerySchema = z.object({
  q: z.string().min(2),
  productType: productTypeSchema.optional(),
  style: styleSchema.optional(),
});

export const generateDesignRequestSchema = z.object({
  prompt: z.string().min(3).max(300),
  productType: productTypeSchema,
  variantId: z.string().uuid().optional(),
});

export const editDesignRequestSchema = z.object({
  designId: z.string().uuid(),
  textOverlay: z.string().max(120).optional(),
});

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  designId: z.string().uuid().optional(),
  textOverlay: z.string().max(120).optional(),
  quantity: z.number().int().min(1).max(50),
});

export const registerRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(100),
  termsAccepted: z.literal(true),
});

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(100),
});

export const checkoutRequestSchema = z.object({
  orderId: z.string().uuid(),
  deliveryMethod: z.enum(["courier", "parcel_locker"]),
  paymentMethod: z.enum(["przelewy24"]),
  address: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    street: z.string().min(1),
    country: z.string().min(2),
  }),
});

export const returnRequestSchema = z.object({
  orderId: z.string().uuid(),
  orderItemId: z.string().uuid(),
  reason: z.enum(["damaged", "wrong_item", "quality_issue", "other"]),
  details: z.string().max(500).optional(),
});

export const apiRouteContract = {
  productsList: { method: "GET", path: "/api/products" },
  productById: { method: "GET", path: "/api/products/:id" },
  search: { method: "GET", path: "/api/search" },
  generateDesign: { method: "POST", path: "/api/designs/generate" },
  editDesign: { method: "POST", path: "/api/designs/:id/edit" },
  productPreview: { method: "POST", path: "/api/previews" },
  cartGet: { method: "GET", path: "/api/cart" },
  cartAddItem: { method: "POST", path: "/api/cart/items" },
  checkout: { method: "POST", path: "/api/checkout" },
  paymentInit: { method: "POST", path: "/api/payments/przelewy24/init" },
  paymentWebhook: { method: "POST", path: "/api/payments/przelewy24/webhook" },
  accountOrders: { method: "GET", path: "/api/account/orders" },
  returnsCreate: { method: "POST", path: "/api/returns" },
  authRegister: { method: "POST", path: "/api/auth/register" },
  authLogin: { method: "POST", path: "/api/auth/login" },
  authMe: { method: "GET", path: "/api/auth/me" },
  authLogout: { method: "POST", path: "/api/auth/logout" },
  ordersCreate: { method: "POST", path: "/api/orders" },
  ordersList: { method: "GET", path: "/api/orders" },
  adminKpi: { method: "GET", path: "/api/admin/kpi" },
  adminOrders: { method: "GET", path: "/api/admin/orders" },
  adminReturns: { method: "GET", path: "/api/admin/returns" },
  adminModeration: { method: "GET", path: "/api/admin/moderation" },
} as const;

export type ApiRouteContract = typeof apiRouteContract;
