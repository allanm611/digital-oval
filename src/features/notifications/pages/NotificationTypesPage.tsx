import { useLanguage } from "../../../contexts/LanguageContext";
import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { notificationTypesConfig } from "../../configurations/configs/configurationPageConfigs";

export default function NotificationTypesPage() {
  const { t } = useLanguage();
  return <TypeConfigurationPage config={notificationTypesConfig} />;
}
