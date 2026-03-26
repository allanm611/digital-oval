import TypeConfigurationPage from "../../../shared/components/TypeConfigurationPage";
import { getCharacterSetsConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function CharacterSetsPage() {
  const { t } = useLanguage();
  return <TypeConfigurationPage config={getCharacterSetsConfig(t)} />;
}
