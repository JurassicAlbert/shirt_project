import type { OrderStatus } from "@prisma/client";
import { ORDER_TIMELINE_FLOW } from "@/lib/order-state-machine";

export type TimelinePhase = "done" | "current" | "upcoming" | "skipped";

export type OrderTimelineStep = {
  status: OrderStatus;
  phase: TimelinePhase;
};

type LogRow = { fromStatus: OrderStatus; toStatus: OrderStatus };

function visitedStatuses(logs: LogRow[]): Set<OrderStatus> {
  const v = new Set<OrderStatus>(["created"]);
  for (const l of logs) {
    v.add(l.toStatus);
  }
  return v;
}

/**
 * Build a linear timeline for display. Uses transition logs when present; otherwise infers position in the canonical flow.
 */
export function buildOrderTimeline(current: OrderStatus, logs: LogRow[]): OrderTimelineStep[] {
  const visited = visitedStatuses(logs);

  if (current === "failed") {
    const failLog = [...logs].reverse().find((l) => l.toStatus === "failed");
    const from = failLog?.fromStatus ?? "created";
    const anchorIdx = ORDER_TIMELINE_FLOW.indexOf(from);
    const lastDone = anchorIdx >= 0 ? anchorIdx : 0;
    return ORDER_TIMELINE_FLOW.map((status, i) => ({
      status,
      phase: i <= lastDone ? ("done" as const) : ("upcoming" as const),
    }));
  }

  if (current === "completed") {
    return ORDER_TIMELINE_FLOW.map((status) => {
      if (status === "shipped" && !visited.has("shipped")) {
        return { status, phase: "skipped" as const };
      }
      return { status, phase: "done" as const };
    });
  }

  const idx = ORDER_TIMELINE_FLOW.indexOf(current);
  if (idx === -1) {
    return ORDER_TIMELINE_FLOW.map((status) => ({ status, phase: "upcoming" as const }));
  }

  return ORDER_TIMELINE_FLOW.map((status, i) => {
    if (i < idx) return { status, phase: "done" as const };
    if (i === idx) return { status, phase: "current" as const };
    return { status, phase: "upcoming" as const };
  });
}
