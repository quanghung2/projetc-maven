import { Injectable } from '@angular/core';
import { OrgLink } from '@b3networks/api/auth';
import { DialPlanV3, OrgLinkConfig } from '@b3networks/api/callcenter';
import { BehaviorSubject, Subject } from 'rxjs';

export const PAGIN = {
  pageStart: 0,
  pageSize: 4
};

@Injectable({
  providedIn: 'root'
})
export class PortalConfigService {
  isChildModalOpen$ = new BehaviorSubject<boolean>(false);
  isStoreCountryWhitelistSuccess$ = new BehaviorSubject<boolean>(false);
  isStoreOrgLinkSuccess$ = new BehaviorSubject<boolean>(false);
  isStoreDialPlansSuccess$ = new Subject<boolean>();
  isStoreCallerIdPlanSuccess$ = new Subject<boolean>();

  dialPlan$ = new Subject<DialPlanV3>();
  callerIdPlanIndex$ = new Subject<number>();
  orgLinks$ = new Subject<OrgLink[]>();
  orgLinkConfig$ = new Subject<OrgLinkConfig>();

  constructor() {}
}
