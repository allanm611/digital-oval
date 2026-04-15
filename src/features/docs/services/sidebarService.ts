import sidebarsV1_0 from '../sidebars.v1.0';
import sidebarsV1_1 from '../sidebars.v1.1';

type SidebarsConfig = {
  [key: string]: (string | Record<string, any>)[];
};

export const getSidebarConfig = (version: string): SidebarsConfig => {
  switch (version) {
    case 'v1.0':
      return sidebarsV1_0;
    case 'v1.1':
      return sidebarsV1_1;
    default:
      return sidebarsV1_1; // Default to latest version
  }
};

export const getSidebar = (version: string) => {
  const config = getSidebarConfig(version);
  return config.tutorialSidebar;
};
