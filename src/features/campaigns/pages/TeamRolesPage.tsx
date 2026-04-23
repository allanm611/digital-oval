import React from "react";
import { ConfigurationManager } from "../../configurations/components/ConfigurationManager";
import { getTeamRolesConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function TeamRolesPage() {
  const { t } = useLanguage();
  return <ConfigurationManager config={getTeamRolesConfig(t)} />;
}
