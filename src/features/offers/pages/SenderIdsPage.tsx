import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { getSenderIdsConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function SenderIdsPage() {
  const { t } = useLanguage();
  return <TypeConfigurationPage config={getSenderIdsConfig(t)} />;
}
