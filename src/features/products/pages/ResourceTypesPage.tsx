import { useLanguage } from "../../../contexts/LanguageContext";
import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getResourceTypesApiConfig } from "../../configurations/configs/configurationPageConfigs";

export default function ResourceTypesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getResourceTypesApiConfig(() => "")} />;
}
