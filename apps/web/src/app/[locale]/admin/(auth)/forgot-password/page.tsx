"use client";

import { Alert, Button, Link as MuiLink, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";

export default function AdminForgotPasswordPage() {
  const t = useTranslations("adminAuth");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <form onSubmit={submit}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("forgotInstructions")}
      </Typography>
      {sent ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("forgotStub")}
        </Alert>
      ) : null}
      <TextField fullWidth label={t("email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" required />
      <Button fullWidth type="submit" variant="contained" size="large" sx={{ mt: 2, py: 1.5 }}>
        {t("sendInstructions")}
      </Button>
      <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
        <MuiLink component={Link} href="/admin/login" underline="hover">
          {t("backToLogin")}
        </MuiLink>
      </Typography>
    </form>
  );
}
