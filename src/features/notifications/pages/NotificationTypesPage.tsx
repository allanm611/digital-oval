import { useLanguage } from "../../../contexts/LanguageContext";
import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getNotificationTypesApiConfig } from "../../configurations/configs/configurationPageConfigs";

export default function NotificationTypesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getNotificationTypesApiConfig(t)} />;
}
