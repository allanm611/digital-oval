import { useLanguage } from "../../../contexts/LanguageContext";
import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getComboTypesApiConfig } from "../../configurations/configs/configurationPageConfigs";

export default function ComboTypesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getComboTypesApiConfig(t)} />;
}

