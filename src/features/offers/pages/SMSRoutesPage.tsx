import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getSmsRoutesApiConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function SMSRoutesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getSmsRoutesApiConfig(t)} />;
}
