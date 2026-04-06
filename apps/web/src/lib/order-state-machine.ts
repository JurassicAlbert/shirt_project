import type { OrderStatus } from "@prisma/client";

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  created: ["payment_pending", "failed"],
  payment_pending: ["paid", "failed"],
  paid: ["shipped", "completed"],
  failed: [],
  shipped: ["completed"],
  completed: [],
};

/** Canonical happy-path steps shown on customer timeline (order may skip `shipped` via admin transition). */
export const ORDER_TIMELINE_FLOW: OrderStatus[] = ["created", "payment_pending", "paid", "shipped", "completed"];

export const getAllowedOrderTransitions = (from: OrderStatus): OrderStatus[] => [...allowedTransitions[from]];

export const assertOrderTransition = (from: OrderStatus, to: OrderStatus) => {
  if (!allowedTransitions[from].includes(to)) {
    throw new Error("invalid_order_transition");
  }
};
