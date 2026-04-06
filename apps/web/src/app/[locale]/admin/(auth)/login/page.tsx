"use client";

import { Alert, Button, Link as MuiLink, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";

export default function AdminLoginPage() {
  const t = useTranslations("adminAuth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    if (password.length < 8 || !email.includes("@")) {
      setError(t("validation"));
      setBusy(false);
      return;
    }
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = (await res.json()) as { ok?: boolean; data?: { role?: string }; error?: { code?: string } };
    if (!res.ok) {
      setBusy(false);
      setError(json.error?.code === "UNAUTHORIZED" ? t("badCredentials") : t("genericError"));
      return;
    }
    const me = await fetch("/api/auth/me").then((r) => r.json());
    const role = me.data?.role as string | undefined;
    if (role !== "admin") {
      await fetch("/api/auth/logout", { method: "POST" });
      setBusy(false);
      setError(t("adminOnly"));
      return;
    }
    setBusy(false);
    router.replace("/admin/dashboard");
  };

  return (
    <form onSubmit={submit}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      <TextField
        fullWidth
        label={t("email")}
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        margin="normal"
        required
      />
      <TextField
        fullWidth
        label={t("password")}
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="normal"
        required
        inputProps={{ minLength: 8 }}
      />
      <Button fullWidth type="submit" variant="contained" size="large" disabled={busy} sx={{ mt: 2, py: 1.5 }}>
        {busy ? t("signingIn") : t("signIn")}
      </Button>
      <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
        <MuiLink component={Link} href="/admin/forgot-password" underline="hover">
          {t("forgotPassword")}
        </MuiLink>
        {" · "}
        <MuiLink component={Link} href="/admin/register" underline="hover">
          {t("createAccount")}
        </MuiLink>
      </Typography>
      <Typography variant="caption" display="block" sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}>
        <MuiLink component={Link} href="/auth/signin" underline="hover">
          {t("storeLogin")}
        </MuiLink>
      </Typography>
    </form>
  );
}
