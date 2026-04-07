import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { notificationTypesConfig } from "../configs/configurationPageConfigs";

export default function NotificationTypesPage() {
  return <TypeConfigurationPage config={notificationTypesConfig} />;
}
