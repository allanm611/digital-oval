import React from "react";
import GenericConfigurationPage from "../../../shared/components/GenericConfigurationPage";
import { getCampaignObjectivesConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function CampaignObjectivesPage() {
  const { t } = useLanguage();
  return <GenericConfigurationPage config={getCampaignObjectivesConfig(t)} />;
}
