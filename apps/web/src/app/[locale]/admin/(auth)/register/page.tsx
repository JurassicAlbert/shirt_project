"use client";

import { Alert, Button, Checkbox, FormControlLabel, Link as MuiLink, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";

export default function AdminRegisterPage() {
  const t = useTranslations("adminAuth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!terms) {
      setError(t("termsRequired"));
      return;
    }
    setBusy(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, termsAccepted: true }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: { code?: string } };
    setBusy(false);
    if (!res.ok) {
      setError(json.error?.code === "CONFLICT" ? t("emailTaken") : t("genericError"));
      return;
    }
    router.replace("/admin/login");
  };

  return (
    <form onSubmit={submit}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("registerHint")}
      </Typography>
      <TextField fullWidth label={t("email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" required />
      <TextField
        fullWidth
        label={t("password")}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="normal"
        required
        inputProps={{ minLength: 8 }}
      />
      <FormControlLabel control={<Checkbox checked={terms} onChange={(e) => setTerms(e.target.checked)} />} label={t("terms")} sx={{ mt: 1 }} />
      <Button fullWidth type="submit" variant="contained" size="large" disabled={busy} sx={{ mt: 2, py: 1.5 }}>
        {t("createAccountSubmit")}
      </Button>
      <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
        <MuiLink component={Link} href="/admin/login" underline="hover">
          {t("haveAccount")}
        </MuiLink>
      </Typography>
    </form>
  );
}
