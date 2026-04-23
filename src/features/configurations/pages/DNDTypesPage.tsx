import { ConfigurationManagerAPI } from "../components/ConfigurationManager";
import { getDNDTypesApiConfig } from "../configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function DNDTypesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getDNDTypesApiConfig(t)} />;
}
