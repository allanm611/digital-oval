export type CustomerProfileCategory =
  | "identity"
  | "subscription"
  | "personal"
  | "location"
  | "device";

export type CustomerProfileOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "less_than"
  | "in"
  | "not_in";

export interface CustomerProfileField {
  id: number;
  field_name: string;
  field_value: string;
  field_type: "text" | "numeric" | "date" | "boolean";
  category: CustomerProfileCategory;
  description: string;
  operators: CustomerProfileOperator[];
  source_table: string;
  data_source: "Live" | "DB";
  frequency: "Per Min" | "Daily" | "Monthly";
}

export const CUSTOMER_PROFILE_FIELDS: CustomerProfileField[] = [
  {
    id: 1,
    field_name: "Customer ID",
    field_value: "customer_id",
    field_type: "numeric",
    category: "identity",
    description: "Unique customer identifier",
    operators: ["equals", "not_equals", "in", "not_in"],
    source_table: "cvm.cdr_customer_subscription_data",
    data_source: "DB",
    frequency: "Daily"
  },
  {
    id: 2,
    field_name: "Subscription ID",
    field_value: "subscription_id",
    field_type: "numeric",
    category: "identity",
    description: "Subscription number",
    operators: ["equals", "not_equals", "in", "not_in"],
    source_table: "cvm.cdr_customer_subscription_data",
    data_source: "DB",
    frequency: "Daily"
  },
  {
    id: 3,
    field_name: "Phone Number",
    field_value: "msisdn",
    field_type: "text",
    category: "identity",
    description: "Customer phone number",
    operators: ["equals", "not_equals", "contains", "in", "not_in"],
    source_table: "cvm.cdr_customer_subscription_data",
    data_source: "DB",
    frequency: "Daily"
  },

  {
    id: 6,
    field_name: "Activation Date",
    field_value: "activation_date",
    field_type: "date",
    category: "subscription",
    description: "Account activation date",
    operators: ["equals", "greater_than", "less_than"],
    source_table: "cvm.cdr_customer_subscription_data",
    data_source: "DB",
    frequency: "Daily"
  },
  {
    id: 7,
    field_name: "Customer Type",
    field_value: "customer_type",
    field_type: "text",
    category: "subscription",
    description: "Account type (Prepaid/Postpaid)",
    operators: ["equals", "not_equals", "in", "not_in"],
    source_table: "cvm.cdr_customer_subscription_data",
    data_source: "DB",
    frequency: "Daily"
  },
  {
    id: 8,
    field_name: "Tariff Plan",
    field_value: "tariff",
    field_type: "text",
    category: "subscription",
    description: "Customer tariff/plan type",
    operators: ["equals", "not_equals", "in", "not_in"],
    source_table: "cvm.cdr_customer_subscription_data",
    data_source: "DB",
    frequency: "Daily"
  },
  {
    id: 11,
    field_name: "Subscription Status",
    field_value: "status",
    field_type: "text",
    category: "subscription",
    description: "Current subscription status",
    operators: ["equals", "not_equals", "in", "not_in"],
    source_table: "cvm.cdr_customer_subscription_data",
    data_source: "DB",
    frequency: "Daily"
  },

  {
    id: 17,
    field_name: "First Name",
    field_value: "first_name",
    field_type: "text",
    category: "personal",
    description: "Customer first name",
    operators: ["equals", "not_equals", "contains", "not_contains"],
    source_table: "cvm.cdr_customer_subscription_data",
    data_source: "DB",
    frequency: "Daily"
  },
  {
    id: 18,
    field_name: "Last Name",
    field_value: "last_name",
    field_type: "text",
    category: "personal",
    description: "Customer last name",
    operators: ["equals", "not_equals", "contains", "not_contains"],
    source_table: "cvm.cdr_customer_subscription_data",
    data_source: "DB",
    frequency: "Daily"
  },
  {
    id: 19,
    field_name: "Birth Date",
    field_value: "birth_date",
    field_type: "date",
    category: "personal",
    description: "Customer date of birth",
    operators: ["equals", "greater_than", "less_than"],
    source_table: "cvm.cdr_customer_subscription_data",
    data_source: "DB",
    frequency: "Daily"
  },
  {
    id: 20,
    field_name: "Gender",
    field_value: "gender",
    field_type: "text",
    category: "personal",
    description: "Customer gender",
    operators: ["equals", "not_equals", "in", "not_in"],
    source_table: "cvm.cdr_customer_subscription_data",
    data_source: "DB",
    frequency: "Daily"
  },
  {
    id: 21,
    field_name: "Email Address",
    field_value: "email_address",
    field_type: "text",
    category: "personal",
    description: "Customer email",
    operators: ["equals", "not_equals", "contains"],
    source_table: "cvm.cdr_customer_subscription_data",
    data_source: "DB",
    frequency: "Daily"
  },

  {
    id: 24,
    field_name: "City",
    field_value: "city",
    field_type: "text",
    category: "location",
    description: "Customer city",
    operators: ["equals", "not_equals", "contains", "in", "not_in"],
    source_table: "cvm.cdr_customer_subscription_data",
    data_source: "DB",
    frequency: "Daily"
  },
  {
    id: 25,
    field_name: "County ID",
    field_value: "customer_county_id",
    field_type: "numeric",
    category: "location",
    description: "Customer county ID",
    operators: ["equals", "not_equals", "in", "not_in"],
    source_table: "cvm.cdr_customer_subscription_data",
    data_source: "DB",
    frequency: "Daily"
  },
  {
    id: 26,
    field_name: "Building",
    field_value: "building",
    field_type: "text",
    category: "location",
    description: "Customer building/address",
    operators: ["equals", "not_equals", "contains"],
    source_table: "cvm.cdr_customer_subscription_data",
    data_source: "DB",
    frequency: "Daily"
  },

  {
    id: 8,
    field_name: "Device Type",
    field_value: "device_type",
    field_type: "text",
    category: "device",
    description: "Device type (4G/3G/2G)",
    operators: ["equals", "not_equals", "in", "not_in"],
    source_table: "cvm.cdr_customer_subscription_data",
    data_source: "DB",
    frequency: "Daily"
  },
  {
    id: 9,
    field_name: "Phone Brand",
    field_value: "phone_brand",
    field_type: "text",
    category: "device",
    description: "Phone brand/manufacturer",
    operators: ["equals", "not_equals", "contains", "in", "not_in"],
    source_table: "cvm.cdr_customer_subscription_data",
    data_source: "DB",
    frequency: "Daily"
  },
];

export const CUSTOMER_PROFILE_BY_CATEGORY = {
  identity: CUSTOMER_PROFILE_FIELDS.filter((f) => f.category === "identity"),
  subscription: CUSTOMER_PROFILE_FIELDS.filter((f) => f.category === "subscription"),
  personal: CUSTOMER_PROFILE_FIELDS.filter((f) => f.category === "personal"),
  location: CUSTOMER_PROFILE_FIELDS.filter((f) => f.category === "location"),
  device: CUSTOMER_PROFILE_FIELDS.filter((f) => f.category === "device"),
};

export const CUSTOMER_PROFILE_CATEGORIES = [
  { value: "identity", label: "Identity Fields" },
  { value: "subscription", label: "Subscription Details" },
  { value: "personal", label: "Personal Information" },
  { value: "location", label: "Location Information" },
  { value: "device", label: "Device Information" },
] as const;
