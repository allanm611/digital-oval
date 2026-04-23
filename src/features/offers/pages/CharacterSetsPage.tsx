import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getCharacterSetsApiConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function CharacterSetsPage() {
  const { t } = useLanguage();
  return <ConfigurationManagerAPI config={getCharacterSetsApiConfig(t)} />;
}
