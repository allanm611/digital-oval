import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getResourceTypesApiConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function ResourceTypesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getResourceTypesApiConfig(t)} />;
}
