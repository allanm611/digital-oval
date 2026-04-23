import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getRewardTypesApiConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function RewardTypesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getRewardTypesApiConfig(t)} />;
}
