import {
  ControlGroupApiModel,
  ControlGroupListResponse,
  ControlGroupStatistics,
  ControlGroupMembersResponse,
  CreateControlGroupRequest,
  CreateUniversalControlGroupRequest,
  UpdateControlGroupRequest,
  AddMemberRequest,
  RemoveMemberRequest,
  BulkAddMembersRequest,
  BulkAddMembersResponse,
  CampaignSegmentControlConfig,
  GenerateMembersResponse,
  ScheduledRunResponse,
  MembershipCheckResponse,
  AddMemberResponse,
} from "../types/controlGroup";
import { buildApiUrl } from "../../../shared/services/api";

const BASE_URL = buildApiUrl("/control-groups");

interface ListParams {
  limit?: number;
  offset?: number;
}

export const controlGroupService = {
  // List all control groups
  async listControlGroups(
    params?: ListParams
  ): Promise<ControlGroupListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());

    const response = await fetch(
      `${BASE_URL}/list${searchParams.toString() ? "?" + searchParams.toString() : ""}`
    );
    if (!response.ok) {
      throw new Error("Failed to list control groups");
    }
    return response.json();
  },

  // Get control group statistics
  async getStatistics(): Promise<ControlGroupStatistics> {
    const response = await fetch(`${BASE_URL}/statistics`);
    if (!response.ok) {
      throw new Error("Failed to get control group statistics");
    }
    return response.json();
  },

  // Get control group by code
  async getControlGroupByCode(code: string): Promise<ControlGroupApiModel> {
    const response = await fetch(`${BASE_URL}/code/${code}`);
    if (!response.ok) {
      throw new Error(`Failed to get control group with code: ${code}`);
    }
    return response.json();
  },

  // Get control group by ID
  async getControlGroupById(id: number): Promise<ControlGroupApiModel> {
    const response = await fetch(`${BASE_URL}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to get control group with ID: ${id}`);
    }
    return response.json();
  },

  // Get members in a control group
  async getControlGroupMembers(
    groupId: number,
    params?: ListParams
  ): Promise<ControlGroupMembersResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());

    const response = await fetch(
      `${BASE_URL}/${groupId}/members${searchParams.toString() ? "?" + searchParams.toString() : ""}`
    );
    if (!response.ok) {
      throw new Error(`Failed to get members for control group ${groupId}`);
    }
    return response.json();
  },

  // Check subscriber membership in control groups
  async checkMembership(subscriberId: number): Promise<MembershipCheckResponse> {
    const response = await fetch(`${BASE_URL}/membership/${subscriberId}`);
    if (!response.ok) {
      throw new Error(`Failed to check membership for subscriber ${subscriberId}`);
    }
    return response.json();
  },

  // Create a new control group
  async createControlGroup(
    data: CreateControlGroupRequest
  ): Promise<ControlGroupApiModel> {
    const response = await fetch(`${BASE_URL}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      let errorMessage = "Failed to create control group";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use generic message
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // Create a universal control group
  async createUniversalControlGroup(
    data: CreateUniversalControlGroupRequest
  ): Promise<ControlGroupApiModel> {
    const response = await fetch(`${BASE_URL}/universal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      let errorMessage = "Failed to create universal control group";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use generic message
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // Update an existing control group
  async updateControlGroup(
    id: number,
    data: UpdateControlGroupRequest
  ): Promise<ControlGroupApiModel> {
    const response = await fetch(`${BASE_URL}/update/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      let errorMessage = `Failed to update control group ${id}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use generic message
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // Add a single member to a control group
  async addMember(data: AddMemberRequest): Promise<AddMemberResponse> {
    const response = await fetch(`${BASE_URL}/members/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      let errorMessage = "Failed to add member to control group";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use generic message
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // Remove a member from a control group
  async removeMember(data: RemoveMemberRequest): Promise<{ message: string }> {
    const response = await fetch(`${BASE_URL}/members/remove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      let errorMessage = "Failed to remove member from control group";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use generic message
      }
      throw new Error(errorMessage);
    }
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return response.json();
    }
    return { message: "Member removed successfully" };
  },

  // Add multiple members in bulk
  async bulkAddMembers(
    data: BulkAddMembersRequest
  ): Promise<BulkAddMembersResponse> {
    const response = await fetch(`${BASE_URL}/members/bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      let errorMessage = "Failed to bulk add members to control group";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use generic message
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // Run scheduled control group population
  async runScheduled(asOf?: string): Promise<ScheduledRunResponse> {
    const searchParams = new URLSearchParams();
    if (asOf) searchParams.append("asOf", asOf);

    const response = await fetch(
      `${BASE_URL}/scheduled/run${searchParams.toString() ? "?" + searchParams.toString() : ""}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );
    if (!response.ok) {
      let errorMessage = "Failed to run scheduled control group population";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use generic message
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // Delete a control group
  async deleteControlGroup(id: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${BASE_URL}/delete/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      let errorMessage = `Failed to delete control group ${id}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use generic message
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // Update segment control configuration
  async updateSegmentControlConfig(
    campaignId: number,
    segmentId: number,
    data: CampaignSegmentControlConfig
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(
      `${BASE_URL}/campaigns/${campaignId}/segments/${segmentId}/control-group`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) {
      let errorMessage = "Failed to update segment control configuration";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use generic message
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // Generate members for segment control group
  async generateSegmentMembers(
    campaignId: number,
    segmentId: number,
    dryRun: boolean = false
  ): Promise<GenerateMembersResponse> {
    const searchParams = new URLSearchParams();
    if (dryRun) searchParams.append("dry_run", "true");

    const response = await fetch(
      `${BASE_URL}/campaigns/${campaignId}/segments/${segmentId}/generate-members${searchParams.toString() ? "?" + searchParams.toString() : ""}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );
    if (!response.ok) {
      let errorMessage = "Failed to generate segment members";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use generic message
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },
};
