import { ComplianceAction } from '../enums';

export interface SipGateway {
  id: number;
  orgUuid: string;
  sipUsername: string;
  consentAction: ComplianceAction;
  dncAction: ComplianceAction;
  createdTime: number;
  status: string;
}

/**
 * A factory function that creates SipGateway
 */
export function createSipGateway(params: Partial<SipGateway>) {
  return {} as SipGateway;
}
