import { useLanguage } from "../../../contexts/LanguageContext";
import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { routesConfig } from "../../../shared/configs/configurationPageConfigs";

export default function RoutesPage() {
  const { t } = useLanguage();
  return <TypeConfigurationPage config={routesConfig} />;
}

