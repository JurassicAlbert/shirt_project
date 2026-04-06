"use client";

import { Box, Button, CssBaseline, ThemeProvider, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { adminTheme } from "./admin-theme";

export function AdminNotFoundView() {
  const t = useTranslations("adminAuth");

  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          p: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="h1" sx={{ fontWeight: 800, fontSize: 72, color: "primary.main" }}>
          404
        </Typography>
        <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
          {t("errorTitle")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 360 }}>
          {t("errorBody")}
        </Typography>
        <Button component={Link} href="/admin/login" variant="contained">
          {t("backDashboard")}
        </Button>
      </Box>
    </ThemeProvider>
  );
}
