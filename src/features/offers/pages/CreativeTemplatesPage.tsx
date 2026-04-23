import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getCreativeTemplatesApiConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function CreativeTemplatesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getCreativeTemplatesApiConfig(t)} />;
}
