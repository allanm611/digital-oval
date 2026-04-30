import { ConfigurationManager } from "../../configurations/components/ConfigurationManager";
import { utilitiesConfig } from "../../configurations/configs/configurationPageConfigs";

export default function UtilitiesPage() {
  return <ConfigurationManager config={utilitiesConfig} />;
}
