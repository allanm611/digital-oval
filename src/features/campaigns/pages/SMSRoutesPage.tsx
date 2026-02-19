import { useLanguage } from "../../../contexts/LanguageContext";
import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { smsRoutesConfig } from "../../../shared/configs/configurationPageConfigs";

export default function SMSRoutesPage() {
  
  return <TypeConfigurationPage config={smsRoutesConfig} />;
}
