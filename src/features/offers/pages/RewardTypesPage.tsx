import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { getRewardTypesConfig } from "../../../shared/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function RewardTypesPage() {
  const { t } = useLanguage();
  return <TypeConfigurationPage config={getRewardTypesConfig(t)} />;
}
