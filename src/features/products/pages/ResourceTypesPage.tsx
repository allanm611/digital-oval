import { ConfigurationManager } from "../../configurations/components/ConfigurationManager";
import { resourceTypesConfig } from "../../configurations/configs/configurationPageConfigs";

export default function ResourceTypesPage() {
  return <ConfigurationManager config={resourceTypesConfig} />;
}
