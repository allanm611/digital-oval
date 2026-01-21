import React from "react";
import { Chip, Typography, Box } from "@mui/material";
import { Role } from "../types/role";
import { color } from "../../../shared/utils/utils";

interface RoleHierarchyChipProps {
  role: Role;
}

export default function RoleHierarchyChip({ role }: RoleHierarchyChipProps) {
  if (!role) {
    return <Typography variant="body2">—</Typography>;
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Chip
        label={role.name}
        size="small"
        variant="outlined"
        sx={{
          borderColor: color.primary.accent,
          color: color.primary.accent,
          fontWeight: 500,
          fontSize: "0.875rem",
        }}
      />
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        (Lvl {role.role_level})
      </Typography>
    </Box>
  );
}
