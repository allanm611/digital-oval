import { ConfigurationManagerAPI } from "../components/ConfigurationManager";
import { getTimezonesApiConfig } from "../configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function TimezonesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getTimezonesApiConfig(t)} />;
}
