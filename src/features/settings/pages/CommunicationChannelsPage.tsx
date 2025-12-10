import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { getCommunicationChannelsConfig } from "../../../shared/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function CommunicationChannelsPage() {
  const { t } = useLanguage();
  return <TypeConfigurationPage config={getCommunicationChannelsConfig(t)} />;
}
