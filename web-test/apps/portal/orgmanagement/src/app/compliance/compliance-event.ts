import { EventMessage } from '@b3networks/shared/utils/message';

export interface ComplianceEvent extends EventMessage {
  showRightSidebar: boolean;
}
