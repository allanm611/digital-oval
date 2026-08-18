import { useLanguage } from "../../../contexts/LanguageContext";
import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getUtilitiesApiConfig } from "../../configurations/configs/configurationPageConfigs";

export default function UtilitiesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getUtilitiesApiConfig(() => "")} />;
}
