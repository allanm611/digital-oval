import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { getCampaignTypesConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function CampaignTypesPage() {
  const { t } = useLanguage();
  return <TypeConfigurationPage config={getCampaignTypesConfig(t)} />;
}
