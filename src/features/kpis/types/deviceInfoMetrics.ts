export type DeviceInfoCategory =
  | "device_profile"
  | "sim_info"
  | "network_type";

export type DeviceInfoOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "in"
  | "not_in";

export interface DeviceInfoMetric {
  id: number;
  name: string;
  description: string;
  field_type: "text" | "numeric";
  category: DeviceInfoCategory;
  operators: DeviceInfoOperator[];
  source_table: string;
  data_source: "Live" | "DB";
  frequency: "Per Min" | "D-1";
}

export const DEVICE_INFO_METRICS: DeviceInfoMetric[] = [
  {
    id: 1,
    name: "Device Type",
    description: "Device type (4G/3G/2G)",
    field_type: "text",
    category: "device_profile",
    operators: ["equals", "not_equals", "in", "not_in"],
    source_table: "BIB_ADM.FLYTXT_DX_DAILY_KPI",
    data_source: "DB",
    frequency: "D-1",
  },
  {
    id: 2,
    name: "Phone Brand",
    description: "Phone brand/manufacturer",
    field_type: "text",
    category: "device_profile",
    operators: ["equals", "not_equals", "contains", "in", "not_in"],
    source_table: "BIB_ADM.FLYTXT_DX_DAILY_KPI",
    data_source: "DB",
    frequency: "D-1",
  },
  {
    id: 3,
    name: "Device Category",
    description: "Device category classification",
    field_type: "text",
    category: "device_profile",
    operators: ["equals", "not_equals", "in", "not_in"],
    source_table: "BIB_ADM.FLYTXT_DX_DAILY_KPI",
    data_source: "DB",
    frequency: "D-1",
  },
  {
    id: 4,
    name: "Smartphone",
    description: "Whether device is a smartphone",
    field_type: "text",
    category: "device_profile",
    operators: ["equals", "not_equals"],
    source_table: "BIB_ADM.FLYTXT_DX_DAILY_KPI",
    data_source: "DB",
    frequency: "D-1",
  },

  {
    id: 5,
    name: "SIM Type",
    description: "SIM Type (4G USIM / 3G SIM / Normal)",
    field_type: "text",
    category: "sim_info",
    operators: ["equals", "not_equals", "in", "not_in"],
    source_table: "BIB_ADM.FLYTXT_DX_DAILY_KPI",
    data_source: "DB",
    frequency: "D-1",
  },
  {
    id: 6,
    name: "SIM Support",
    description: "SIM support level",
    field_type: "text",
    category: "sim_info",
    operators: ["equals", "not_equals", "in", "not_in"],
    source_table: "BIB_ADM.FLYTXT_DX_DAILY_KPI",
    data_source: "DB",
    frequency: "D-1",
  },
  {
    id: 7,
    name: "TAC",
    description: "Type Allocation Code for device",
    field_type: "numeric",
    category: "sim_info",
    operators: ["equals", "not_equals", "in", "not_in"],
    source_table: "BIB_ADM.FLYTXT_DX_DAILY_KPI",
    data_source: "DB",
    frequency: "D-1",
  },

  {
    id: 8,
    name: "Network Type",
    description: "Primary network type used by device",
    field_type: "text",
    category: "network_type",
    operators: ["equals", "not_equals", "in", "not_in"],
    source_table: "BIB_ADM.FLYTXT_DX_DAILY_KPI",
    data_source: "DB",
    frequency: "D-1",
  },
  {
    id: 9,
    name: "CELL_ID",
    description: "Last cell ID used by device",
    field_type: "numeric",
    category: "network_type",
    operators: ["equals", "not_equals"],
    source_table: "BIB_ADM.FLYTXT_DX_DAILY_KPI",
    data_source: "DB",
    frequency: "D-1",
  },
];

export const DEVICE_INFO_METRICS_BY_CATEGORY = {
  device_profile: DEVICE_INFO_METRICS.filter((m) => m.category === "device_profile"),
  sim_info: DEVICE_INFO_METRICS.filter((m) => m.category === "sim_info"),
  network_type: DEVICE_INFO_METRICS.filter((m) => m.category === "network_type"),
};

export const DEVICE_INFO_CATEGORIES = [
  { value: "device_profile", label: "Device Profile" },
  { value: "sim_info", label: "SIM Info" },
  { value: "network_type", label: "Network Type" },
] as const;
