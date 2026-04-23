import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getCommunicationChannelsApiConfig } from "../../configurations/configs/configurationPageConfigs";

export default function CommunicationChannelsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleChannelRowClick = (channelName: string) => {
    if (channelName.toLowerCase().includes("sms")) {
      navigate("/dashboard/sms-routes");
    }
  };

  return (
    <ConfigurationManagerAPI
      config={getCommunicationChannelsApiConfig(t)}
      onRowClick={handleChannelRowClick}
    />
  );
}
