import React from "react";
import { PermissionGate } from "../../auth/components/PermissionGate";
import UserAnalyticsPage from "./UserAnalyticsPage";

const UserAnalyticsPageWrapper: React.FC = () => {
  return (
    <PermissionGate permission="users.view">
      <UserAnalyticsPage />
    </PermissionGate>
  );
};

export default UserAnalyticsPageWrapper;
