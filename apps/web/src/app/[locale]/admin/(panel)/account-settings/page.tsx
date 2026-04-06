"use client";

import { Box, Button, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminAccountSettingsPage() {
  const t = useTranslations("adminAuth");
  const tc = useTranslations("common");
  const [email, setEmail] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/auth/me");
      const json = (await res.json()) as { data?: { email?: string } };
      setEmail(json.data?.email ?? "");
    })();
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        {t("accountSettingsTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t("accountSettingsHint")}
      </Typography>
      <TextField fullWidth label={t("email")} value={email} InputProps={{ readOnly: true }} margin="normal" />
      <Button
        variant="outlined"
        sx={{ mt: 2 }}
        onClick={() => toast.info(t("accountSettingsStub"))}
      >
        {tc("save")}
      </Button>
    </Box>
  );
}
