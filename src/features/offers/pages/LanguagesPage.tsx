import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getLanguagesApiConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function LanguagesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getLanguagesApiConfig(t)} />;
}
