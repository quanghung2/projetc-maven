export enum UsageLimitType {
  'credit' = 'credit',
  'duration' = 'duration'
}

export interface UsageControl {
  budget: number;
  usage: number;
  balance: number;
  totalDuration: number;
  type: UsageLimitType;
  usedDuration: number;
}
