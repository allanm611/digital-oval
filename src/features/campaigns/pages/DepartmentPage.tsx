import React from "react";
import GenericConfigurationPage from "../../../shared/components/GenericConfigurationPage";
import { getDepartmentsConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function DepartmentPage() {
  const { t } = useLanguage();
  return <GenericConfigurationPage config={getDepartmentsConfig(t)} />;
}
