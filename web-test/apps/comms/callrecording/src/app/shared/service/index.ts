import { BackendService } from './backend.service';
import { CallLogService } from './call-log.service';
import { ComplianceService } from './compliance.service';
import { ContactService } from './contact.service';
import { CookieService } from './cookie.service';
import { HistoryService } from './history.service';
import { ModalService } from './modal.service';
import { NewComplianceService } from './new-compliance.service';
import { NewHistoryService } from './new-history.service';
import { StreamService } from './stream.service';
import { SubscriptionService } from './subscription.service';
import { TermService } from './term.service';
import { UserService } from './user.service';

export * from './backend.service';
export * from './call-log.service';
export * from './compliance.service';
export * from './contact.service';
export * from './cookie.service';
export * from './history.service';
export * from './modal.service';
export * from './subscription.service';
export * from './term.service';
export * from './user.service';

export const SharedServices = [
  BackendService,
  CookieService,
  UserService,
  HistoryService,
  SubscriptionService,
  ModalService,
  ContactService,
  ComplianceService,
  TermService,
  CallLogService,
  NewComplianceService,
  NewHistoryService,
  StreamService
];
