import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getUtilitiesApiConfig } from "../../configurations/configs/configurationPageConfigs";

export default function UtilitiesPage() {
  return <ConfigurationManagerAPI config={getUtilitiesApiConfig(() => "")} />;
}
