import type { TimelineStepVm } from "@/components/flow/OrderTimelineStrip";

export type OrderDetailPayload = {
  order: { id: string; status: string; totalGross: unknown; createdAt: string; userId?: string };
  transitions: Array<{ id: string; fromStatus: string; toStatus: string; createdAt: string; reason?: string | null }>;
  timeline: TimelineStepVm[];
  nextStatuses: string[];
};
