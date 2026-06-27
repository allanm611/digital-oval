import { useLanguage } from "../../../contexts/LanguageContext";
import SMSRoutesList from "../components/SMSRoutesList";

export default function SMSRoutesPage() {
  const { t } = useLanguage();
  return <SMSRoutesList />;
}
