import { segmentService } from "../../segments/services/segmentService";

export interface SubscriberProfile {
  id: number;
  name: string;
  description: string;
  field_type?: string;
  category?: string;
  operators?: string[];
  source_table?: string;
  data_source?: string;
  frequency?: string;
  unit?: string;
}

export const subscriberProfileService = {
  getAllProfiles: async (): Promise<SubscriberProfile[]> => {
    try {
      const response = await segmentService.getSegmentationFields(true);
      if (response && response.success && response.data && response.data.length > 0) {
        const config = response.data[0]?.field_selector_config || [];

        // Find Customer 360 and extract from sub_categories
        const customer360 = config.find((cat: any) => cat.value === "customer_360");

        if (!customer360 || !customer360.sub_categories) {
          return [];
        }

        const allProfiles = customer360.sub_categories.flatMap((subcat: any) =>
          (subcat.fields || []).map((field: any) => ({
            id: field.id,
            name: field.field_name,
            description: field.field_description || "",
            field_type: field.field_type?.toLowerCase() || "text",
            category: "subscriber",
            operators: field.operators?.map((op: any) => op.label) || [],
            source_table: field.source_table || "",
            data_source: field.data_source || "DB",
            frequency: field.data_latency || "Daily",
            unit: field.unit || "",
          }))
        );

        return allProfiles;
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch subscriber profiles:", err);
      return [];
    }
  },

  getProfileById: async (id: number): Promise<SubscriberProfile | null> => {
    const profiles = await subscriberProfileService.getAllProfiles();
    return profiles.find((p) => p.id === id) || null;
  },
};
