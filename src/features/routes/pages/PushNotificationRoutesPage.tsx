import { useLanguage } from "../../../contexts/LanguageContext";
import PushNotificationRoutesList from "../components/PushNotificationRoutesList";

export default function PushNotificationRoutesPage() {
  const { t } = useLanguage();
  return <PushNotificationRoutesList />;
}
