import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getProductTypesApiConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function ProductTypesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getProductTypesApiConfig(t)} />;
}
