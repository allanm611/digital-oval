import { useLanguage } from "../../../contexts/LanguageContext";
import ConfigurationManagerAPI from "../../configurations/components/ConfigurationManager/ConfigurationManagerAPI";
import { getDepartmentsApiConfig } from "../../configurations/configs/configurationPageConfigs";

export default function DepartmentPage() {
  const { t } = useLanguage();
  const config = getDepartmentsApiConfig(t);
  return <ConfigurationManagerAPI config={config} />;
}
