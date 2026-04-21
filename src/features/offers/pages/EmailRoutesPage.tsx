import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { getEmailRoutesConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function EmailRoutesPage() {
  const { t } = useLanguage();
  return <TypeConfigurationPage config={getEmailRoutesConfig(t)} />;
}
