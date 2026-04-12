import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { getResourceTypesConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function ResourceTypesPage() {
  const { t } = useLanguage();
  return <TypeConfigurationPage config={getResourceTypesConfig(t)} />;
}
