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
import { toast } from "sonner";

export function AdminJobsClient() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [jobs, setJobs] = useState<Array<Record<string, unknown>>>([]);
  const [jobFilter, setJobFilter] = useState<"all" | "waiting" | "failed" | "dead_letter">("all");
  const [boot, setBoot] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [jobDialog, setJobDialog] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const j = await fetch(`/api/admin/jobs?status=${jobFilter}`).then((x) => x.json());
      if (!cancelled) {
        setJobs(j.data?.items ?? []);
        setBoot(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobFilter]);

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

  if (boot) {
    return (
      <>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          {t("navJobs")}
        </Typography>
        <Skeleton variant="rounded" height={280} />
      </>
    );
  }

  return (
    <>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        {t("navJobs")}
      </Typography>
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
                        <Button
                          size="small"
                          sx={{ ml: 1 }}
                          disabled={actionId === id}
                          onClick={() => retryJob(id)}
                          data-testid="admin-job-retry"
                        >
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
    </>
  );
}
