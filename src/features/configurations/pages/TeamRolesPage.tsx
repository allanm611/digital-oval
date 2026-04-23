import { useLanguage } from "../../../contexts/LanguageContext";
import ConfigurationManagerAPI from "../components/ConfigurationManager/ConfigurationManagerAPI";
import { getRolesApiConfig } from "../configs/configurationPageConfigs";

export default function TeamRolesPage() {
  const { t } = useLanguage();
  const config = getRolesApiConfig(t);

  return <ConfigurationManagerAPI config={config} />;
}
