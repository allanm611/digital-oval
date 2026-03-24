import GenericConfigurationPage from "../../../shared/components/GenericConfigurationPage";
import { getTrackingSourcesConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function TrackingSourcesPage() {
  const { t } = useLanguage();
  return <GenericConfigurationPage config={getTrackingSourcesConfig(t)} />;
}
