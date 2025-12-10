import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { getCreativeTemplatesConfig } from "../../../shared/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function CreativeTemplatesPage() {
  const { t } = useLanguage();
  return <TypeConfigurationPage config={getCreativeTemplatesConfig(t)} />;
}
