import { useLanguage } from "../../../contexts/LanguageContext";
import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getSmsRoutesApiConfig } from "../../configurations/configs/configurationPageConfigs";

export default function SMSRoutesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getSmsRoutesApiConfig(t)} />;
}
