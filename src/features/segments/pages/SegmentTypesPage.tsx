import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getSegmentTypesApiConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function SegmentTypesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getSegmentTypesApiConfig(t)} />;
}
