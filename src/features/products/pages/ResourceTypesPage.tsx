import { ConfigurationManagerAPI } from "../../configurations/components/ConfigurationManager";
import { getResourceTypesApiConfig } from "../../configurations/configs/configurationPageConfigs";

export default function ResourceTypesPage() {
  return <ConfigurationManagerAPI config={getResourceTypesApiConfig(() => "")} />;
}
