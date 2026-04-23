import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getEmailRoutesApiConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function EmailRoutesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getEmailRoutesApiConfig(t)} />;
}
