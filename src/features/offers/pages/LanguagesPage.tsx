import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { getLanguagesConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function LanguagesPage() {
  const { t } = useLanguage();
  return <TypeConfigurationPage config={getLanguagesConfig(t)} />;
}
