"use client";

import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import GavelIcon from "@mui/icons-material/Gavel";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import QueueIcon from "@mui/icons-material/Queue";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { OrderTimelineStrip, type TimelineStepVm } from "@/components/flow/OrderTimelineStrip";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const drawerWidth = 260;

const theme = createTheme({
  palette: {
    primary: { main: "#9155FD" },
    background: { default: "#F5F5F9", paper: "#FFFFFF" },
  },
  shape: { borderRadius: 10 },
  typography: { fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' },
});

type Tab = "dashboard" | "orders" | "returns" | "jobs" | "moderation";

type OrderDetailPayload = {
  order: { id: string; status: string; totalGross: unknown; createdAt: string; userId?: string };
  transitions: Array<{ id: string; fromStatus: string; toStatus: string; createdAt: string; reason?: string | null }>;
  timeline: TimelineStepVm[];
  nextStatuses: string[];
};

export default function AdminPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tOrder = useTranslations("state.order");
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [kpi, setKpi] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [returns, setReturns] = useState<Array<Record<string, unknown>>>([]);
  const [jobs, setJobs] = useState<Array<Record<string, unknown>>>([]);
  const [jobFilter, setJobFilter] = useState<"all" | "waiting" | "failed" | "dead_letter">("all");
  const [moderation, setModeration] = useState<Array<Record<string, unknown>>>([]);
  const [boot, setBoot] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const [orderDialogId, setOrderDialogId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetailPayload | null>(null);
  const [orderDialogLoading, setOrderDialogLoading] = useState(false);

  const [jobDialog, setJobDialog] = useState<Record<string, unknown> | null>(null);

  const [returnHistId, setReturnHistId] = useState<string | null>(null);
  const [returnHist, setReturnHist] = useState<{ return: unknown; history: unknown[] } | null>(null);

  const [returnDecideId, setReturnDecideId] = useState<string | null>(null);
  const [returnDecision, setReturnDecision] = useState<string>("approved");
  const [returnNote, setReturnNote] = useState("");

  const loadCore = useCallback(async () => {
    const [k, o, r, m] = await Promise.all([
      fetch("/api/admin/kpi").then((x) => x.json()),
      fetch("/api/admin/orders").then((x) => x.json()),
      fetch("/api/admin/returns").then((x) => x.json()),
      fetch("/api/admin/moderation").then((x) => x.json()),
    ]);
    setKpi(k.data ?? {});
    setOrders(o.data?.items ?? []);
    setReturns(r.data?.items ?? []);
    setModeration(m.data?.items ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      await loadCore();
      const j = await fetch(`/api/admin/jobs?status=${jobFilter}`).then((x) => x.json());
      setJobs(j.data?.items ?? []);
      setBoot(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial boot only
  }, []);

  useEffect(() => {
    if (boot) return;
    void (async () => {
      const j = await fetch(`/api/admin/jobs?status=${jobFilter}`).then((x) => x.json());
      setJobs(j.data?.items ?? []);
    })();
  }, [jobFilter, boot]);

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

  const kpiCards = [
    { key: "ordersTotal", label: t("kpiOrders") },
    { key: "returnsTotal", label: t("kpiReturns") },
    { key: "designsTotal", label: t("kpiDesigns") },
    { key: "usersTotal", label: t("kpiUsers") },
  ];

  const navItems: Array<{ id: Tab; icon: ReactNode; label: string }> = [
    { id: "dashboard", icon: <DashboardCustomizeIcon fontSize="small" />, label: t("navDashboard") },
    { id: "orders", icon: <ShoppingBagIcon fontSize="small" />, label: t("navOrders") },
    { id: "returns", icon: <AssignmentReturnIcon fontSize="small" />, label: t("navReturns") },
    { id: "jobs", icon: <QueueIcon fontSize="small" />, label: t("navJobs") },
    { id: "moderation", icon: <GavelIcon fontSize="small" />, label: t("navModeration") },
  ];

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  const moderate = async (designId: string, decision: "approve" | "reject") => {
    setActionId(designId);
    const res = await fetch(`/api/admin/designs/${designId}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setActionId(null);
    if (res.ok) {
      toast.success(decision === "approve" ? t("approve") : t("reject"));
      await loadCore();
    } else toast.error(t("transitionFail"));
  };

  const retryJob = async (jobId: string) => {
    setActionId(jobId);
    const res = await fetch(`/api/admin/jobs/${jobId}/retry`, { method: "POST" });
    setActionId(null);
    if (res.ok) {
      toast.success(tc("retry"));
      const j = await fetch(`/api/admin/jobs?status=${jobFilter}`).then((x) => x.json());
      setJobs(j.data?.items ?? []);
    } else toast.error(t("transitionFail"));
  };

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

  const openReturnHistory = async (id: string) => {
    setReturnHistId(id);
    const res = await fetch(`/api/admin/returns/${id}`);
    const json = (await res.json()) as { data?: { return: unknown; history: unknown[] } };
    setReturnHist(json.data ?? { return: null, history: [] });
  };

  const submitReturnDecision = async () => {
    if (!returnDecideId) return;
    const res = await fetch(`/api/admin/returns/${returnDecideId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: returnDecision, note: returnNote || undefined }),
    });
    if (res.ok) {
      toast.success(t("returnUpdated"));
      setReturnDecideId(null);
      setReturnNote("");
      await loadCore();
    } else toast.error(t("transitionFail"));
  };

  const renderContent = () => {
    if (boot) {
      if (tab === "dashboard") {
        return (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: 2 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" height={100} />
            ))}
          </Box>
        );
      }
      return <Skeleton variant="rounded" height={280} />;
    }

    if (tab === "dashboard") {
      return (
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
      );
    }

    if (tab === "orders") {
      if (orders.length === 0) {
        return (
          <Card elevation={0} sx={{ border: "1px dashed", borderColor: "divider", p: 4, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              {t("ordersEmpty")}
            </Typography>
            <Button sx={{ mt: 2 }} variant="contained" href="/" component="a" startIcon={<OpenInNewIcon />}>
              {t("ordersEmptyCta")}
            </Button>
          </Card>
        );
      }
      return (
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
                      <Button
                        size="small"
                        variant="outlined"
                        data-testid="admin-order-manage"
                        onClick={() => setOrderDialogId(oid)}
                      >
                        {t("orderDetail")}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    if (tab === "returns") {
      if (returns.length === 0) {
        return (
          <Card elevation={0} sx={{ border: "1px dashed", borderColor: "divider", p: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {t("returnsEmpty")}
            </Typography>
          </Card>
        );
      }
      return (
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: "action.hover" }}>
              <TableRow>
                <TableCell>{t("colId")}</TableCell>
                <TableCell>{t("colStatus")}</TableCell>
                <TableCell>{t("colCreated")}</TableCell>
                <TableCell>{t("colEmail")}</TableCell>
                <TableCell align="right">{t("decideReturn")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {returns.map((row) => {
                const rid = String(row.id);
                return (
                  <TableRow key={rid} hover>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{rid.slice(0, 8)}…</TableCell>
                    <TableCell>
                      <Chip label={String(row.status)} size="small" />
                    </TableCell>
                    <TableCell>{new Date(String((row as { createdAt?: string }).createdAt ?? "")).toLocaleString()}</TableCell>
                    <TableCell>{String((row as { user?: { email?: string } }).user?.email ?? "—")}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => void openReturnHistory(rid)}>
                        {t("viewHistory")}
                      </Button>
                      <Button size="small" sx={{ ml: 1 }} variant="contained" onClick={() => setReturnDecideId(rid)}>
                        {t("decideReturn")}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    if (tab === "jobs") {
      return (
        <Box>
          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            {(["all", "waiting", "failed", "dead_letter"] as const).map((s) => (
              <Button key={s} size="small" variant={jobFilter === s ? "contained" : "outlined"} onClick={() => setJobFilter(s)}>
                {s === "all" ? t("filterAll") : s}
              </Button>
            ))}
          </Box>
          {jobs.length === 0 ? (
            <Card elevation={0} sx={{ border: "1px dashed", borderColor: "divider", p: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {t("jobsEmpty")}
              </Typography>
            </Card>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "action.hover" }}>
                  <TableRow>
                    <TableCell>{t("colId")}</TableCell>
                    <TableCell>{t("colType")}</TableCell>
                    <TableCell>{t("colStatus")}</TableCell>
                    <TableCell>{t("colAttempts")}</TableCell>
                    <TableCell>Error</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobs.map((row) => {
                    const id = String((row as { id?: string }).id ?? "");
                    const st = String((row as { status?: string }).status ?? "");
                    const err = String((row as { errorReason?: string }).errorReason ?? "—");
                    return (
                      <TableRow key={id} hover data-testid="admin-job-row">
                        <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{id.slice(0, 8)}…</TableCell>
                        <TableCell>{String((row as { type?: string }).type)}</TableCell>
                        <TableCell>
                          <Chip label={st} size="small" />
                        </TableCell>
                        <TableCell>{String((row as { attemptCount?: number }).attemptCount ?? 0)}</TableCell>
                        <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {err}
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => setJobDialog(row)}>
                            {t("jobDetails")}
                          </Button>
                          {(st === "dead_letter" || st === "failed") && (
                            <Button size="small" sx={{ ml: 1 }} disabled={actionId === id} onClick={() => retryJob(id)} data-testid="admin-job-retry">
                              {tc("retry")}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      );
    }

    if (moderation.length === 0) {
      return (
        <Card elevation={0} sx={{ border: "1px dashed", borderColor: "divider", p: 4, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            {t("moderationEmpty")}
          </Typography>
          <Button sx={{ mt: 2 }} variant="outlined" href="/create" component="a">
            {t("ordersEmptyCta")}
          </Button>
        </Card>
      );
    }

    return (
      <Box sx={{ display: "grid", gap: 2 }}>
        {moderation.map((row) => {
          const id = String((row as { id?: string }).id ?? "");
          const imageUrl = (row as { imageUrl?: string | null }).imageUrl;
          const prompt = String((row as { prompt?: string }).prompt ?? "");
          return (
            <Card key={id} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
                <Box
                  sx={{
                    width: { xs: "100%", md: 160 },
                    height: 120,
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "action.hover",
                    flexShrink: 0,
                  }}
                >
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : null}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t("colPrompt")}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {prompt}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    {String((row as { user?: { email?: string } }).user?.email ?? "")}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Button variant="contained" color="success" size="small" disabled={actionId === id} onClick={() => moderate(id, "approve")}>
                    {t("approve")}
                  </Button>
                  <Button variant="outlined" color="error" size="small" disabled={actionId === id} onClick={() => moderate(id, "reject")}>
                    {t("reject")}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            bgcolor: "background.paper",
            color: "text.primary",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              {t("barTitle")}
            </Typography>
            <Button color="inherit" variant="outlined" size="small" onClick={logout}>
              {t("logout")}
            </Button>
          </Toolbar>
        </AppBar>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              borderRight: "1px solid",
              borderColor: "divider",
            },
          }}
        >
          <Toolbar sx={{ px: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
              {t("brand")}
            </Typography>
          </Toolbar>
          <List sx={{ px: 1 }}>
            {navItems.map((item) => (
              <ListItemButton key={item.id} selected={tab === item.id} onClick={() => setTab(item.id)} sx={{ borderRadius: 2, mb: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 40, color: tab === item.id ? "primary.main" : "text.secondary" }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: tab === item.id ? 600 : 400 }} />
              </ListItemButton>
            ))}
          </List>
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
          <Toolbar />
          <Box sx={{ display: { xs: "flex", md: "none" }, gap: 1, mb: 2, flexWrap: "wrap" }}>
            {navItems.map((item) => (
              <IconButton key={item.id} color={tab === item.id ? "primary" : "default"} onClick={() => setTab(item.id)} size="small">
                {item.icon}
              </IconButton>
            ))}
          </Box>
          {renderContent()}
        </Box>
      </Box>

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

      <Dialog open={!!jobDialog} onClose={() => setJobDialog(null)} fullWidth maxWidth="md">
        <DialogTitle>{t("jobDetails")}</DialogTitle>
        <DialogContent dividers>
          {jobDialog ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="body2">
                <strong>ID:</strong> {String(jobDialog.id)}
              </Typography>
              <Typography variant="body2">
                <strong>{t("colStatus")}:</strong> {String(jobDialog.status)}
              </Typography>
              <Typography variant="body2">
                <strong>{t("colAttempts")}:</strong> {String(jobDialog.attemptCount ?? 0)} / {String(jobDialog.maxAttempts ?? "")}
              </Typography>
              <Typography variant="body2">
                <strong>Error:</strong> {String(jobDialog.errorReason ?? "—")}
              </Typography>
              <Typography variant="subtitle2">{t("payload")}</Typography>
              <Box component="pre" sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1, overflow: "auto", fontSize: 12 }}>
                {JSON.stringify({ payload: jobDialog.payload, result: jobDialog.result }, null, 2)}
              </Box>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJobDialog(null)}>{t("close")}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!returnHistId} onClose={() => setReturnHistId(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t("returnHistory")}</DialogTitle>
        <DialogContent dividers>
          {returnHist?.history?.length ? (
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {returnHist.history.map((h: unknown, i: number) => {
                const row = h as { id?: string; createdAt?: string; eventType?: string; payload?: unknown };
                return (
                  <li key={row.id ?? i}>
                    <Typography variant="body2">
                      {row.eventType} · {row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}
                    </Typography>
                    <Typography variant="caption" component="pre" sx={{ whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(row.payload, null, 2)}
                    </Typography>
                  </li>
                );
              })}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              —
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnHistId(null)}>{t("close")}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!returnDecideId} onClose={() => setReturnDecideId(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t("decideReturn")}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Status</InputLabel>
            <Select value={returnDecision} label="Status" onChange={(e) => setReturnDecision(e.target.value)}>
              <MenuItem value="approved">approved</MenuItem>
              <MenuItem value="rejected">rejected</MenuItem>
              <MenuItem value="refunded">refunded</MenuItem>
              <MenuItem value="escalated">escalated</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            sx={{ mt: 2 }}
            label={t("noteOptional")}
            value={returnNote}
            onChange={(e) => setReturnNote(e.target.value)}
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDecideId(null)}>{t("close")}</Button>
          <Button variant="contained" onClick={() => void submitReturnDecision()}>
            {tc("save")}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
