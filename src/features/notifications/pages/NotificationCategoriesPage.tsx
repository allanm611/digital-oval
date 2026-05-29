import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getNotificationCategoriesApiConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function NotificationCategoriesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getNotificationCategoriesApiConfig(t)} />;
}
