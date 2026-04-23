import { fetchWithAuthInterceptor } from '../../../shared/services/fetchInterceptor';
import { ApiResponse } from '../../../shared/types/api';
import { CommunicationPolicyConfiguration, CreateCommunicationPolicyRequest } from '../types/communicationPolicyConfig';
import { buildApiUrl } from '../../../shared/services/api';

class CommunicationPolicyService {
    private baseUrl = buildApiUrl('/communication-policies');
    private policies: CommunicationPolicyConfiguration[] = [];
    private subscribers: Set<(policies: CommunicationPolicyConfiguration[]) => void> = new Set();

    private async request<T>(
        endpoint: string,
        options?: RequestInit
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options?.headers,
        };

        const response = await fetchWithAuthInterceptor(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.error || errorData.message || `HTTP ${response.status}`
            );
        }

        return response.json();
    }

    // Get all policies
    async getAllPolicies(): Promise<CommunicationPolicyConfiguration[]> {
        try {
            const data = await this.request<ApiResponse<CommunicationPolicyConfiguration[]>>('');
            if (data && Array.isArray(data.data)) {
                this.policies = data.data;
                this.notifySubscribers();
                return data.data;
            } else if (data && data.data) {
                const policyArray = Array.isArray(data.data) ? data.data : [data.data];
                this.policies = policyArray;
                this.notifySubscribers();
                return policyArray;
            }
        } catch (error) {
            console.debug('Failed to fetch policies (endpoint may not exist yet):', error);
        }
        return [];
    }

    // Get active policies only
    getActivePolicies(): CommunicationPolicyConfiguration[] {
        return this.policies.filter(policy => policy.isActive);
    }

    // Get policy by ID
    getPolicyById(id: number): CommunicationPolicyConfiguration | undefined {
        return this.policies.find(policy => policy.id === id);
    }

    // Create new policy
    async createPolicy(policyData: CreateCommunicationPolicyRequest): Promise<CommunicationPolicyConfiguration> {
        const data = await this.request<ApiResponse<CommunicationPolicyConfiguration>>('', {
            method: 'POST',
            body: JSON.stringify(policyData),
        });
        if (data && data.data) {
            this.policies.push(data.data);
            this.notifySubscribers();
            return data.data;
        }
        throw new Error('Failed to create policy');
    }

    // Keeping the old synchronous method for backward compatibility
    createPolicySync(policyData: CreateCommunicationPolicyRequest): CommunicationPolicyConfiguration {
        const newPolicy: CommunicationPolicyConfiguration = {
            id: Math.max(...this.policies.map(p => p.id), 0) + 1,
            ...policyData,
            isActive: policyData.isActive ?? true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        this.policies.push(newPolicy);
        this.notifySubscribers();
        return newPolicy;
    }

    // Update existing policy (async - hits API)
    async updatePolicy(id: number, policyData: Partial<CreateCommunicationPolicyRequest>): Promise<CommunicationPolicyConfiguration> {
        const data = await this.request<ApiResponse<CommunicationPolicyConfiguration>>(`/${id}`, {
            method: 'PUT',
            body: JSON.stringify(policyData),
        });
        if (data && data.data) {
            const index = this.policies.findIndex(p => p.id === id);
            if (index !== -1) {
                this.policies[index] = data.data;
                this.notifySubscribers();
            }
            return data.data;
        }
        throw new Error('Failed to update policy');
    }

    // Delete policy (async - hits API)
    async deletePolicy(id: number): Promise<void> {
        await this.request<void>(`/${id}`, {
            method: 'DELETE',
        });
        const index = this.policies.findIndex(p => p.id === id);
        if (index !== -1) {
            this.policies.splice(index, 1);
            this.notifySubscribers();
        }
    }

    // Subscribe to policy changes
    subscribe(callback: (policies: CommunicationPolicyConfiguration[]) => void): () => void {
        this.subscribers.add(callback);
        
        // Return unsubscribe function
        return () => {
            this.subscribers.delete(callback);
        };
    }

    // Notify all subscribers of changes
    private notifySubscribers(): void {
        this.subscribers.forEach(callback => {
            callback([...this.policies]);
        });
    }

    // Search policies
    searchPolicies(searchTerm: string): CommunicationPolicyConfiguration[] {
        if (!searchTerm.trim()) return this.getAllPolicies();

        const term = searchTerm.toLowerCase();
        return this.policies.filter(policy =>
            policy.name.toLowerCase().includes(term) ||
            (policy.description && policy.description.toLowerCase().includes(term))
        );
    }
}


export const communicationPolicyService = new CommunicationPolicyService();
