import {
  AdminRepository,
  AuditWriteRepository,
  BackgroundJobRepository,
  CartRepository,
  DesignRepository,
  IdempotencyRepository,
  MockupCacheRepository,
  OrderRepository,
  PaymentRepository,
  ProductRepository,
  ReturnRepository,
  UserRepository,
} from "@shirt/infrastructure";

export const userRepository = new UserRepository();
export const productRepository = new ProductRepository();
export const cartRepository = new CartRepository();
export const orderRepository = new OrderRepository();
export const designRepository = new DesignRepository();
export const returnRepository = new ReturnRepository();
export const paymentRepository = new PaymentRepository();
export const adminRepository = new AdminRepository();
export const idempotencyRepository = new IdempotencyRepository();
export const backgroundJobRepository = new BackgroundJobRepository();
export const mockupCacheRepository = new MockupCacheRepository();
export const auditWriteRepository = new AuditWriteRepository();
