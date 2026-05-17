import React from "react";
import { ConfigurationManager } from "../../configurations/components/ConfigurationManager";
import { getTeamRolesConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";
import BackButton from "../../../shared/components/ui/BackButton";

export default function TeamRolesPage() {
  const { t } = useLanguage();
  return (
    <>
      <div className="space-y-6">
        <BackButton
          fallbackTo="/dashboard/administration"
          showBreadcrumb={true}
          parentLabel="Admin Hub"
          currentLabel="Access Control"
        />
        <div className="mt-6">
          <ConfigurationManager config={getTeamRolesConfig(t)} />
        </div>
      </div>
    </>
  );
}
