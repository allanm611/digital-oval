import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getSenderIdsApiConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function SenderIdsPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getSenderIdsApiConfig(t)} />;
}
