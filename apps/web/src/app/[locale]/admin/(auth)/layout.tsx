"use client";

import { Box, Card, CssBaseline, ThemeProvider, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { adminTheme } from "@/components/admin/admin-theme";

export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("adminAuth");

  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          p: 2,
        }}
      >
        <Card elevation={3} sx={{ width: "100%", maxWidth: 440, p: { xs: 3, sm: 4 } }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: "primary.main" }}>
            {t("brand")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("authSubtitle")}
          </Typography>
          {children}
        </Card>
      </Box>
    </ThemeProvider>
  );
}
