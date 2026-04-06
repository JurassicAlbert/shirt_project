import { createTheme } from "@mui/material/styles";

export const adminTheme = createTheme({
  palette: {
    primary: { main: "#9155FD" },
    background: { default: "#F5F5F9", paper: "#FFFFFF" },
  },
  shape: { borderRadius: 10 },
  typography: { fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' },
});
