import { Component, OnDestroy } from '@angular/core';
import { addMonths, addYears, format } from 'date-fns';
import { Subject, Subscription } from 'rxjs';
import { CacheService, EventStreamService, MemberInfoModel } from '../shared';
import { UserManagementService } from './user-management.service';

declare var X: any;
export const SIZE_MEMBER = 1000;

@Component({
  selector: 'user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnDestroy {
  loading: boolean = true;
  searchStr: string = '';
  subscriptionInfo: any = {
    dpoSubscription: {}
  };
  staffList: any = [];
  nonStaffList: any = [];
  agentList: any = [];
  managerList: any = [];
  dpoList: any = [];
  selectedAgent: any = {};
  selectingCustomExpiredDate: boolean = false;
  subscriptions = new Array<Subscription>();

  members: MemberInfoModel[] = [];
  page = 0;
  isFetchingMember: boolean;
  private isAllMember$ = new Subject<boolean>();

  constructor(
    private eventStreamService: EventStreamService,
    private cacheService: CacheService,
    private userManagementService: UserManagementService
  ) {
    // handle member with great than 1000 member
    this.isFetchingMember = true;
    this.loadMember();
    this.subscriptions.push(
      this.isAllMember$.asObservable().subscribe(_ => {
        this.isFetchingMember = false;
        this.loadData();

        this.subscriptionInfo = this.cacheService.get('subscription-info');
        if (!this.subscriptionInfo || !this.subscriptionInfo.dpoSubscription) {
          this.subscriptionInfo = {
            dpoSubscription: {}
          };
        }

        this.subscriptions.push(
          this.eventStreamService.on('user-management:reload').subscribe(e => {
            this.loading = true;
            this.loadData();
          })
        );

        this.subscriptions.push(
          this.eventStreamService.on('user-management:unassign-agent').subscribe(e => {
            this.loading = true;
            this.userManagementService.unassignAgent(e.agent.agentUuid).subscribe(
              res => {
                this.eventStreamService.trigger('hide-confirmation');
                this.loadData();
              },
              res => {
                this.eventStreamService.trigger('hide-confirmation');
                X.showWarn(`Cannot unassign agent ${e.agent.info.displayName} because ${res.message.toLowerCase()}`);
              }
            );
          })
        );

        this.subscriptions.push(
          this.eventStreamService.on('user-management:resend-magic-link').subscribe(e => {
            this.loading = true;
            this.userManagementService.resendMagicLink(e.agent.agentUuid).subscribe(
              res => {
                this.eventStreamService.trigger('hide-confirmation');
                this.loading = false;
              },
              res => {
                this.eventStreamService.trigger('hide-confirmation');
                X.showWarn(
                  `Cannot resend invatation for agent ${e.agent.info.displayName} because ${res.message.toLowerCase()}`
                );
              }
            );
          })
        );

        this.subscriptions.push(
          this.eventStreamService.on('user-management:convert-legacy-agent').subscribe(e => {
            this.userManagementService.convertLegacyAgent(e.agent.agentUuid).subscribe(
              res => {
                this.eventStreamService.trigger('hide-confirmation');
                this.loadData();
              },
              res => {
                this.eventStreamService.trigger('hide-confirmation');
                X.showWarn(
                  `Cannot convert agent ${
                    e.agent.info ? e.agent.info.displayName : e.agent.agentUuid
                  } because ${res.message.toLowerCase()}`
                );
              }
            );
          })
        );
      })
    );
  }

  ngOnDestroy() {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }

  loadData() {
    this.userManagementService.loadData(this.members).subscribe(
      res => {
        this.dpoList = res.dpos;
        this.managerList = res.managers;
        this.agentList = res.agents;
        this.staffList = res.staffs;
        this.nonStaffList = res.nonStaffs;
        this.loading = false;
        this.selectingCustomExpiredDate = false;
      },
      res => {
        this.loading = false;
        X.showWarn(`Cannot load data because ${res.message.toLowerCase()}`);
      }
    );
  }

  loadMember() {
    // unsubscribe because detroy component
    this.subscriptions.push(
      this.userManagementService.getMembers(this.page, SIZE_MEMBER).subscribe(list => {
        this.members = this.members.concat(list);
        if (list.length > 0 && list.length === SIZE_MEMBER) {
          this.page++;
          this.loadMember();
        } else {
          this.isAllMember$.next(true);
        }
      })
    );
  }

  openAssignDpoModal() {
    this.eventStreamService.trigger('show-assign-agent', { role: 'DPO' });
  }

  openAssignManagerModal() {
    this.eventStreamService.trigger('show-assign-agent', { role: 'MANAGER' });
  }

  openAssignStaffModal() {
    this.eventStreamService.trigger('show-assign-agent', { role: 'STAFF' });
  }

  openAssignAgentModal() {
    this.eventStreamService.trigger('show-assign-agent', { role: 'AGENT' });
  }

  unassignAgent(agent) {
    this.eventStreamService.trigger('show-confirmation', {
      title: 'Unassign',
      message: `Are you sure you want to unassign user ${agent.agentName ? agent.agentName : agent.info.displayName}?`,
      type: 'yesno',
      okEvent: {
        event: 'user-management:unassign-agent',
        data: {
          agent: agent
        }
      },
      cancelEvent: {}
    });
  }

  resendMagicLink(agent) {
    this.eventStreamService.trigger('show-confirmation', {
      title: 'Resend Invitation',
      message: `Are you sure you want to resend invitation for user ${
        agent.agentName ? agent.agentName : agent.info.displayName
      }?`,
      type: 'yesno',
      okEvent: {
        event: 'user-management:resend-magic-link',
        data: {
          agent: agent
        }
      },
      cancelEvent: {}
    });
  }

  convertLegacyAgent(agent) {
    this.eventStreamService.trigger('show-confirmation', {
      title: 'Resend Invitation',
      message: `Are you sure you want to convert user ${
        agent.info ? agent.info.displayName : agent.agentUuid
      }? to new agent subscription?`,
      type: 'yesno',
      okEvent: {
        event: 'user-management:convert-legacy-agent',
        data: {
          agent: agent
        }
      },
      cancelEvent: {}
    });
  }

  exportAgent() {
    this.loading = true;
    this.userManagementService.exportAgent().subscribe(
      res => {
        this.loading = false;
      },
      res => {
        this.loading = false;
        X.showWarn(`Cannot export because ${res.message.toLowerCase()}`);
      }
    );
  }

  setNextMonthExpiredDate() {
    this.setExpiredDate(addMonths(new Date(), 1));
  }

  setNextYearExpiredDate() {
    this.setExpiredDate(addYears(new Date(), 1));
  }

  setAutoExtendExpiredDate() {
    this.loading = true;
    this.selectingCustomExpiredDate = false;
    this.userManagementService.setExpiredDate(this.selectedAgent.agentUuid, null).subscribe(
      res => {
        this.loadData();
      },
      res => {
        X.showWarn(
          `Cannot set expired date for user ${this.selectedAgent.info.displayName} because ${res.message.toLowerCase()}`
        );
      }
    );
  }

  setExpiredDate(date) {
    this.loading = true;
    this.selectingCustomExpiredDate = false;
    let expiredDate = format(date, 'yyyy-MM-dd');
    this.userManagementService.setExpiredDate(this.selectedAgent.agentUuid, expiredDate).subscribe(
      res => {
        this.loadData();
      },
      res => {
        X.showWarn(
          `Cannot set expired date for user ${this.selectedAgent.info.displayName} because ${res.message.toLowerCase()}`
        );
      }
    );
  }
}
