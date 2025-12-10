import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { getOfferTypesConfig } from "../../../shared/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function OfferTypesPage() {
  const { t } = useLanguage();
  return <TypeConfigurationPage config={getOfferTypesConfig(t)} />;
}
