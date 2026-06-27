import { useLanguage } from "../../../contexts/LanguageContext";
import WhatsAppRoutesList from "../components/WhatsAppRoutesList";

export default function WhatsAppRoutesPage() {
  const { t } = useLanguage();
  return <WhatsAppRoutesList />;
}
