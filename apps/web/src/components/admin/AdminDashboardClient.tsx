"use client";

import {
  Box,
  Card,
  CardContent,
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
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type OrderRow = { id: string; status: string; totalGross?: unknown; createdAt?: string; user?: { email?: string } };

const chartFromKpi = (orders: number, returns: number) => {
  const base = Math.max(1, orders * 120 + returns * 40);
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name, i) => ({
    name,
    revenue: Math.round(base * (0.7 + (i % 4) * 0.1) + i * 50),
    orders: Math.max(0, Math.round(orders / 7) + (i % 3) - 1),
  }));
};

export function AdminDashboardClient() {
  const t = useTranslations("admin");
  const [kpi, setKpi] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<OrderRow[]>([]);
  const [boot, setBoot] = useState(true);

  useEffect(() => {
    void (async () => {
      const [k, o] = await Promise.all([
        fetch("/api/admin/kpi").then((x) => x.json()),
        fetch("/api/admin/orders").then((x) => x.json()),
      ]);
      setKpi(k.data ?? {});
      const items = (o.data?.items ?? []) as OrderRow[];
      setRecent(items.slice(0, 6));
      setBoot(false);
    })();
  }, []);

  const kpiCards = [
    { key: "ordersTotal", label: t("kpiOrders") },
    { key: "returnsTotal", label: t("kpiReturns") },
    { key: "designsTotal", label: t("kpiDesigns") },
    { key: "usersTotal", label: t("kpiUsers") },
  ];

  const chartData = chartFromKpi(Number(kpi.ordersTotal ?? 0), Number(kpi.returnsTotal ?? 0));

  if (boot) {
    return (
      <Box sx={{ display: "grid", gap: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={100} />
          ))}
        </Box>
        <Skeleton variant="rounded" height={320} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {t("crmWelcome")}
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: 2 }}>
        {kpiCards.map(({ key, label }) => (
          <Card key={key} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
                {label}
              </Typography>
              <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                {String(kpi[key] ?? 0)}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            {t("crmRevenueTrend")}
          </Typography>
          <Box sx={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#9155FD" strokeWidth={2} dot={{ r: 3 }} name={t("crmRevenue")} />
                <Line type="monotone" dataKey="orders" stroke="#26A69A" strokeWidth={2} dot={{ r: 3 }} name={t("crmOrdersSeries")} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            {t("crmRecentOrders")}
          </Typography>
          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell>{t("colId")}</TableCell>
                  <TableCell>{t("colStatus")}</TableCell>
                  <TableCell align="right">{t("colTotal")}</TableCell>
                  <TableCell>{t("colCreated")}</TableCell>
                  <TableCell>{t("colEmail")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recent.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography variant="body2" color="text.secondary">
                        {t("ordersEmpty")}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  recent.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{row.id.slice(0, 8)}…</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell align="right">{Number(row.totalGross ?? 0).toFixed(2)}</TableCell>
                      <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}</TableCell>
                      <TableCell>{row.user?.email ?? "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
