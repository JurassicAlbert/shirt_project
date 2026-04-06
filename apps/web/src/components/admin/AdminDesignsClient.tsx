"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Skeleton,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";

export function AdminDesignsClient() {
  const t = useTranslations("admin");
  const [moderation, setModeration] = useState<Array<Record<string, unknown>>>([]);
  const [boot, setBoot] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadCore = useCallback(async () => {
    const m = await fetch("/api/admin/moderation").then((x) => x.json());
    setModeration(m.data?.items ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      await loadCore();
      setBoot(false);
    })();
  }, [loadCore]);

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

  if (boot) {
    return (
      <>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          {t("navDesigns")}
        </Typography>
        <Skeleton variant="rounded" height={280} />
      </>
    );
  }

  if (moderation.length === 0) {
    return (
      <>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          {t("navDesigns")}
        </Typography>
        <Card elevation={0} sx={{ border: "1px dashed", borderColor: "divider", p: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {t("moderationEmpty")}
        </Typography>
        <Button sx={{ mt: 2 }} variant="outlined" component={Link} href="/create">
          {t("ordersEmptyCta")}
        </Button>
      </Card>
      </>
    );
  }

  return (
    <>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        {t("navDesigns")}
      </Typography>
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
    </>
  );
}
