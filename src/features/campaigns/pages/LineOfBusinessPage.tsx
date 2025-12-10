import React from "react";
import GenericConfigurationPage from "../../../shared/components/GenericConfigurationPage";
import { getLineOfBusinessConfig } from "../../../shared/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function LineOfBusinessPage() {
  const { t } = useLanguage();
  return <GenericConfigurationPage config={getLineOfBusinessConfig(t)} />;
}
