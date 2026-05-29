import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getKpiCategoriesApiConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function KpiCategoriesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getKpiCategoriesApiConfig(t)} />;
}
