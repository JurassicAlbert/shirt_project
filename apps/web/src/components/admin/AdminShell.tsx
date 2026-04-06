"use client";

import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import GavelIcon from "@mui/icons-material/Gavel";
import QueueIcon from "@mui/icons-material/Queue";
import SettingsIcon from "@mui/icons-material/Settings";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import {
  AppBar,
  Box,
  Button,
  CssBaseline,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { adminTheme } from "./admin-theme";

const drawerWidth = 260;

const nav = [
  { href: "/admin/dashboard" as const, icon: <DashboardCustomizeIcon fontSize="small" />, key: "navDashboard" as const },
  { href: "/admin/orders" as const, icon: <ShoppingBagIcon fontSize="small" />, key: "navOrders" as const },
  { href: "/admin/returns" as const, icon: <AssignmentReturnIcon fontSize="small" />, key: "navReturns" as const },
  { href: "/admin/jobs" as const, icon: <QueueIcon fontSize="small" />, key: "navJobs" as const },
  { href: "/admin/designs" as const, icon: <GavelIcon fontSize="small" />, key: "navDesigns" as const },
  { href: "/admin/account-settings" as const, icon: <SettingsIcon fontSize="small" />, key: "navAccountSettings" as const },
];

function pathMatches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const pathname = usePathname();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  return (
    <ThemeProvider theme={adminTheme}>
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
            {nav.map((item) => {
              const selected = pathMatches(pathname, item.href);
              return (
                <ListItemButton
                  key={item.href}
                  component={Link}
                  href={item.href}
                  selected={selected}
                  sx={{ borderRadius: 2, mb: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: selected ? "primary.main" : "text.secondary" }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={t(item.key)} primaryTypographyProps={{ fontWeight: selected ? 600 : 400 }} />
                </ListItemButton>
              );
            })}
          </List>
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
          <Toolbar />
          <Box sx={{ display: { xs: "flex", md: "none" }, gap: 1, mb: 2, flexWrap: "wrap", overflowX: "auto" }}>
            {nav.map((item) => (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                size="small"
                variant={pathMatches(pathname, item.href) ? "contained" : "outlined"}
                startIcon={item.icon}
              >
                {t(item.key)}
              </Button>
            ))}
          </Box>
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
