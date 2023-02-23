export interface Record {
  text: string;
}

export interface OAuthStatus {
  domains: Domain[];
  lastUpdatedDateTime: number,
  clientId: string;
}

export interface Domain {
  domain: string;
  verificationDnsRecords: VerificationDnsRecord[];
  status: 'UNVERIFIED' | 'VERIFIED' | 'ACTIVATED';
}

export interface VerificationDnsRecord {
  id: string;
  label: string;
  text: string;
}

export interface MSUser {
  displayName: string;
  email: string;
  principalName: string;
}

export interface Subscription {
  skuId: string;
  skuPartNumber: string;
}
