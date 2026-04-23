import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getCommunicationChannelsApiConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function CommunicationChannelsPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getCommunicationChannelsApiConfig(t)} />;
}
