"use client";

import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
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
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function AdminReturnsClient() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [returns, setReturns] = useState<Array<Record<string, unknown>>>([]);
  const [boot, setBoot] = useState(true);
  const [returnHistId, setReturnHistId] = useState<string | null>(null);
  const [returnHist, setReturnHist] = useState<{ return: unknown; history: unknown[] } | null>(null);
  const [returnDecideId, setReturnDecideId] = useState<string | null>(null);
  const [returnDecision, setReturnDecision] = useState("approved");
  const [returnNote, setReturnNote] = useState("");

  const loadCore = useCallback(async () => {
    const r = await fetch("/api/admin/returns").then((x) => x.json());
    setReturns(r.data?.items ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      await loadCore();
      setBoot(false);
    })();
  }, [loadCore]);

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

  if (boot) {
    return (
      <>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          {t("navReturns")}
        </Typography>
        <Skeleton variant="rounded" height={280} />
      </>
    );
  }

  if (returns.length === 0) {
    return (
      <>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          {t("navReturns")}
        </Typography>
        <Card elevation={0} sx={{ border: "1px dashed", borderColor: "divider", p: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {t("returnsEmpty")}
        </Typography>
      </Card>
      </>
    );
  }

  return (
    <>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        {t("navReturns")}
      </Typography>
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
    </>
  );
}
