import { useLanguage } from "../../../contexts/LanguageContext";
import KpiCategoriesListPage from "../components/KpiCategoriesListPage";

export default function KpiCategoriesPage() {
  const { t } = useLanguage();
  return <KpiCategoriesListPage />;
}
