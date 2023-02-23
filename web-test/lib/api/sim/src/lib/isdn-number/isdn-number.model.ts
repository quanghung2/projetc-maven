import { ComplianceAction, CrConfig } from '@b3networks/api/bizphone';

export interface IsdnNumber {
  number: string;
  orgUuid: string;
  subscriptionUuid: string;
  assignees: string[];
  dncAction: ComplianceAction | null;
  crConfig: CrConfig | null;
  consentAction: ComplianceAction | null;
  lastSyncAt: number;
  isAllowedToConfig: Boolean;
}

export function createIsdnNumber(params: Partial<IsdnNumber>) {
  return {} as IsdnNumber;
}
