import { useLanguage } from "../../../contexts/LanguageContext";
import ConfigurationManagerAPI from "../../configurations/components/ConfigurationManager/ConfigurationManagerAPI";
import { getPolicyTypesApiConfig } from "../../configurations/configs/configurationPageConfigs";

export default function PolicyTypesPage() {
  const { t } = useLanguage();
  const config = getPolicyTypesApiConfig(t);
  return <ConfigurationManagerAPI config={config} />;
}
