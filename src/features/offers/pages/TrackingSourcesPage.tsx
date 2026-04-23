import { ConfigurationManager } from "../../configurations/components/ConfigurationManager";
import { getTrackingSourcesConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function TrackingSourcesPage() {
  const { t } = useLanguage();
  return <ConfigurationManager config={getTrackingSourcesConfig(t)} />;
}
