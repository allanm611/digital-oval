import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { getSegmentTypesConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function SegmentTypesPage() {
  const { t } = useLanguage();
  return <TypeConfigurationPage config={getSegmentTypesConfig(t)} />;
}
