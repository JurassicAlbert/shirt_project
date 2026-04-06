"use client";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { OrderTimelineStrip } from "@/components/flow/OrderTimelineStrip";
import type { OrderDetailPayload } from "./admin-types";

export function AdminOrdersClient() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tOrder = useTranslations("state.order");
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [boot, setBoot] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [orderDialogId, setOrderDialogId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetailPayload | null>(null);
  const [orderDialogLoading, setOrderDialogLoading] = useState(false);

  const loadCore = useCallback(async () => {
    const o = await fetch("/api/admin/orders").then((x) => x.json());
    setOrders(o.data?.items ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      await loadCore();
      setBoot(false);
    })();
  }, [loadCore]);

  useEffect(() => {
    if (!orderDialogId) {
      setOrderDetail(null);
      return;
    }
    const run = async () => {
      setOrderDialogLoading(true);
      const res = await fetch(`/api/admin/orders/${orderDialogId}`);
      const json = (await res.json()) as { data?: OrderDetailPayload };
      setOrderDetail(json.data ?? null);
      setOrderDialogLoading(false);
    };
    void run();
  }, [orderDialogId]);

  const applyOrderTransition = async (orderId: string, to: string) => {
    setActionId(orderId);
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to }),
    });
    setActionId(null);
    if (res.ok) {
      toast.success(t("transitionOk"));
      await loadCore();
      const r = await fetch(`/api/admin/orders/${orderId}`);
      const j = (await r.json()) as { data?: OrderDetailPayload };
      setOrderDetail(j.data ?? null);
    } else toast.error(t("transitionFail"));
  };

  if (boot) {
    return (
      <>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          {t("navOrders")}
        </Typography>
        <Skeleton variant="rounded" height={280} />
      </>
    );
  }

  if (orders.length === 0) {
    return (
      <>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          {t("navOrders")}
        </Typography>
        <Card elevation={0} sx={{ border: "1px dashed", borderColor: "divider", p: 4, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          {t("ordersEmpty")}
        </Typography>
        <Button sx={{ mt: 2 }} variant="contained" component={Link} href="/" startIcon={<OpenInNewIcon />}>
          {t("ordersEmptyCta")}
        </Button>
      </Card>
      </>
    );
  }

  return (
    <>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        {t("navOrders")}
      </Typography>
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "action.hover" }}>
            <TableRow>
              <TableCell>{t("colId")}</TableCell>
              <TableCell>{t("colStatus")}</TableCell>
              <TableCell align="right">{t("colTotal")}</TableCell>
              <TableCell>{t("colCreated")}</TableCell>
              <TableCell>{t("colEmail")}</TableCell>
              <TableCell align="right">{t("orderDetail")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((row) => {
              const oid = String(row.id);
              return (
                <TableRow key={oid} hover>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{oid.slice(0, 8)}…</TableCell>
                  <TableCell>
                    <Chip label={String(row.status)} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">{Number((row as { totalGross?: unknown }).totalGross ?? 0).toFixed(2)}</TableCell>
                  <TableCell>{new Date(String((row as { createdAt?: string }).createdAt ?? "")).toLocaleString()}</TableCell>
                  <TableCell>{String((row as { user?: { email?: string } }).user?.email ?? "—")}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" data-testid="admin-order-manage" onClick={() => setOrderDialogId(oid)}>
                      {t("orderDetail")}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!orderDialogId} onClose={() => setOrderDialogId(null)} fullWidth maxWidth="md">
        <DialogTitle>{t("orderDetail")}</DialogTitle>
        <DialogContent dividers>
          {orderDialogLoading || !orderDetail ? (
            <Skeleton variant="rounded" height={160} />
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {orderDetail.order.id}
              </Typography>
              <Typography variant="subtitle2">{t("timelineTitle")}</Typography>
              <Box sx={{ color: "text.primary" }}>
                <OrderTimelineStrip steps={orderDetail.timeline} showFailedBanner={orderDetail.order.status === "failed"} />
              </Box>
              <Typography variant="subtitle2">{t("transitionLog")}</Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {orderDetail.transitions.map((tr) => (
                  <li key={tr.id}>
                    <Typography variant="body2">
                      {t("fromTo", {
                        from: tOrder(tr.fromStatus as "created"),
                        to: tOrder(tr.toStatus as "created"),
                      })}{" "}
                      · {new Date(tr.createdAt).toLocaleString()}
                    </Typography>
                  </li>
                ))}
              </Box>
              <Typography variant="subtitle2">{t("nextAdmin")}</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {orderDetail.nextStatuses.map((ns) => (
                  <Button
                    key={ns}
                    size="small"
                    variant="contained"
                    disabled={actionId === orderDetail.order.id}
                    data-testid={`admin-order-transition-${ns}`}
                    onClick={() => applyOrderTransition(orderDetail.order.id, ns)}
                  >
                    {tOrder(ns as "created")}
                  </Button>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDialogId(null)}>{t("close")}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
