import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getUtilitiesApiConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function UtilitiesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getUtilitiesApiConfig(t)} />;
}
