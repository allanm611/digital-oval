import { useLanguage } from "../../../contexts/LanguageContext";
import USSDRoutesList from "../components/USSDRoutesList";

export default function USSDRoutesPage() {
  const { t } = useLanguage();
  return <USSDRoutesList />;
}
