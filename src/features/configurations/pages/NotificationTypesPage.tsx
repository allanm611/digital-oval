import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { getNotificationTypesConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function NotificationTypesPage() {
  const { t } = useLanguage();
  return <TypeConfigurationPage config={getNotificationTypesConfig(t)} />;
}
