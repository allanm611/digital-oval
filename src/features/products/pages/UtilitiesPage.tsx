import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { getUtilitiesConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function UtilitiesPage() {
  const { t } = useLanguage();
  return <TypeConfigurationPage config={getUtilitiesConfig(t)} />;
}
