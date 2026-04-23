import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getCampaignObjectivesApiConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function CampaignObjectivesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getCampaignObjectivesApiConfig(t)} />;
}
