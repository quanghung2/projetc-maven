export interface PolicyDomain {
  version?: string;
  createAt?: number;
  updatedAt?: number;
  policies: Policy[];
}

export interface Policy {
  service: string;
  action: string;
  resources: string[];
}
