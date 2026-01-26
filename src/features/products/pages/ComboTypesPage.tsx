import { useLanguage } from "../../../contexts/LanguageContext";
import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { comboTypesConfig } from "../../../shared/configs/configurationPageConfigs";

export default function ComboTypesPage() {
  const { t } = useLanguage();
  return <TypeConfigurationPage config={comboTypesConfig} />;
}

