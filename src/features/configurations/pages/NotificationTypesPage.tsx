import { ConfigurationManagerAPI } from "../components/ConfigurationManager";
import { getNotificationTypesApiConfig } from "../configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function NotificationTypesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getNotificationTypesApiConfig(t)} />;
}
