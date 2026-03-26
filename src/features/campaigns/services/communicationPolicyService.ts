import { CommunicationPolicyConfiguration, CreateCommunicationPolicyRequest } from '../types/communicationPolicyConfig';

class CommunicationPolicyService {
    private policies: CommunicationPolicyConfiguration[] = [];
    private subscribers: Set<(policies: CommunicationPolicyConfiguration[]) => void> = new Set();

    constructor() {
        // Initialize with sample data
        this.policies = [
            {
                id: 1,
                name: 'Business Hours Time Window',
                description: 'Allow communications only during business hours',
                channels: ['EMAIL', 'SMS'],
                type: 'timeWindow',
                config: {
                    startTime: '09:00',
                    endTime: '18:00',
                    timezone: 'UTC',
                    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
                },
                isActive: true,
                created_at: '2024-01-15T10:30:00Z',
                updated_at: '2024-01-20T14:45:00Z'
            },
            {
                id: 2,
                name: 'Daily Communication Limit',
                description: 'Maximum 3 communications per customer per day',
                channels: ['SMS', 'USSD'],
                type: 'maximumCommunication',
                config: {
                    type: 'daily',
                    maxCount: 3,
                    resetTime: '00:00'
                },
                isActive: true,
                created_at: '2024-01-10T09:15:00Z',
                updated_at: '2024-01-18T16:20:00Z'
            },
            {
                id: 3,
                name: 'Marketing DND Policy',
                description: 'Do not disturb policy for marketing communications',
                channels: ['APP', 'EMAIL'],
                type: 'dnd',
                config: {
                    categories: [
                        {
                            id: '1',
                            name: 'Marketing Campaigns',
                            type: 'marketing',
                            status: 'stop'
                        }
                    ]
                },
                isActive: true,
                created_at: '2024-01-12T11:20:00Z',
                updated_at: '2024-01-22T09:30:00Z'
            },
            {
                id: 4,
                name: 'VIP Customer Priority',
                description: 'Priority handling for VIP customers',
                channels: ['EMAIL', 'SMS', 'APP', 'USSD'],
                type: 'vipList',
                config: {
                    action: 'include',
                    vipLists: [],
                    priority: 1
                },
                isActive: true,
                created_at: '2024-01-08T14:15:00Z',
                updated_at: '2024-01-25T10:45:00Z'
            }
        ];
    }

    // Get all policies
    getAllPolicies(): CommunicationPolicyConfiguration[] {
        return [...this.policies];
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
    createPolicy(policyData: CreateCommunicationPolicyRequest): CommunicationPolicyConfiguration {
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

    // Update existing policy
    updatePolicy(id: number, policyData: Partial<CreateCommunicationPolicyRequest>): CommunicationPolicyConfiguration | null {
        const index = this.policies.findIndex(policy => policy.id === id);
        if (index === -1) return null;

        this.policies[index] = {
            ...this.policies[index],
            ...policyData,
            updated_at: new Date().toISOString()
        };

        this.notifySubscribers();
        return this.policies[index];
    }

    // Delete policy
    deletePolicy(id: number): boolean {
        const index = this.policies.findIndex(policy => policy.id === id);
        if (index === -1) return false;

        this.policies.splice(index, 1);
        this.notifySubscribers();
        return true;
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
