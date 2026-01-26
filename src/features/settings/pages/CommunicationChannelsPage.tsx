import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { communicationChannelsConfig } from "../../../shared/configs/configurationPageConfigs";

export default function CommunicationChannelsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Handle row click - navigate to SMS routes if SMS channel is clicked
  const handleChannelRowClick = (channelName: string) => {
    if (channelName.toLowerCase().includes("sms")) {
      navigate("/dashboard/sms-routes");
    }
    // For other channels in the future, add more conditions
  };

  return (
    <TypeConfigurationPage
      config={communicationChannelsConfig}
      onRowClick={handleChannelRowClick}
    />
  );
}
