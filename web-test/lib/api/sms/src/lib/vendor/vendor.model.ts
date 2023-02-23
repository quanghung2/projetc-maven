export interface Vendor {
  label: string;
  code: string;
  endpoint: string;
  password: string;
  postbackUrl: string;
  username: string;
  restMaxRatePerSec: number;
  name: string;
  status: 'ENABLED' | 'DISABLED';
}
