import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getOfferTypesApiConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function OfferTypesPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getOfferTypesApiConfig(t)} />;
}
