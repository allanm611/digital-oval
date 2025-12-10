import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { getProductTypesConfig } from "../../../shared/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function ProductTypesPage() {
  const { t } = useLanguage();
  return <TypeConfigurationPage config={getProductTypesConfig(t)} />;
}
