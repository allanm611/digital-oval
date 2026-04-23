import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getCampaignTypesApiConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function CampaignTypesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getCampaignTypesApiConfig(t)} />;
}
