import { useLanguage } from "../../../contexts/LanguageContext";
import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { smsRoutesConfig } from "../../configurations/configs/configurationPageConfigs";

export default function SMSRoutesPage() {
  
  return <TypeConfigurationPage config={smsRoutesConfig} />;
}
