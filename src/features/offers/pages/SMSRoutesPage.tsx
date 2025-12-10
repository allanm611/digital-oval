import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { getSmsRoutesConfig } from "../../../shared/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function SMSRoutesPage() {
  const { t } = useLanguage();
  return <TypeConfigurationPage config={getSmsRoutesConfig(t)} />;
}
