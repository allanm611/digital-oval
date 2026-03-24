import React from "react";
import GenericConfigurationPage from "../../../shared/components/GenericConfigurationPage";
import { getTeamRolesConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function TeamRolesPage() {
  const { t } = useLanguage();
  return <GenericConfigurationPage config={getTeamRolesConfig(t)} />;
}
