import { useLanguage } from "../../../contexts/LanguageContext";
import { ConfigurationManagerAPI } from "../components/ConfigurationManager";
import { getVIPListsApiConfig } from "../configs/configurationPageConfigs";

export default function VIPListsPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getVIPListsApiConfig(t)} />;
}
