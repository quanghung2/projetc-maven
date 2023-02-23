import { Component, ElementRef, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { filter } from 'rxjs/operators';
import { ComplianceModalComponent } from '../compliance';
import { ComplianceService, CRSubscription, ModalMessage, ModalService, MsApps, Pagination, User } from '../shared';
import { SubscriptionService, UserService } from '../shared/service';
import { Stream, StreamId, StreamService } from '../shared/service/stream.service';
import { BizphoneModalComponent } from './bizphone-modal/bizphone-modal.component';
import { DirectlineModalComponent } from './directline-modal/directline-modal.component';
import { SipModalComponent } from './sip-modal/sip-modal.component';
import { VirtuallineModalComponent } from './virtualline-modal/virtualline-modal.component';

declare let jQuery: any;

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css']
})
export class SubscriptionComponent implements OnInit {
  public action: EventEmitter<Object> = new EventEmitter();
  @ViewChild('dropdownType', { static: true }) dropdownType: ElementRef;
  @ViewChild('dropdownApp', { static: true }) dropdownApp: ElementRef;

  public crComplianceLicense = 0;
  public subscriptions: Array<CRSubscription>;
  public currentPage = 1;
  public maxPage = 999999;
  public sizePage = 8;

  public filterConcurrentCalls = 0;
  public filterAssignedType = 'all';
  public reload = false;
  public isAppV2 = false;

  public user: User;

  constructor(
    private subscriptionService: SubscriptionService,
    private msApps: MsApps,
    private modalService: ModalService,
    private complianceService: ComplianceService,
    private userService: UserService,
    private streamService: StreamService
  ) {}

  ngOnInit() {
    this.user = this.userService.getCurrentUser();
    this.getAppSuite();
    this.fetchSubscription();

    this.action.subscribe(action => {
      if (action['name'] == 'refresh') {
        this.fetchSubscription();
      }
    });

    this.streamService
      .getStream()
      .pipe(filter(stream => stream.id == StreamId.REFRESH_SUBSCRIPTIONS))
      .subscribe((stream: Stream) => {
        this.fetchSubscription();
      });
  }

  ngAfterViewInit() {
    jQuery(this.dropdownType.nativeElement).dropdown({
      onChange: value => {
        if (value == 'all') {
          this.filterConcurrentCalls = 0;
        } else if (value == 'ultimate') {
          this.filterConcurrentCalls = 30;
        } else if (value == 'businessplus') {
          this.filterConcurrentCalls = 10;
        } else if (value == 'business') {
          this.filterConcurrentCalls = 5;
        } else if (value == 'professional') {
          this.filterConcurrentCalls = 2;
        }

        this.fetchSubscription(this.currentPage, false);
      }
    });
    jQuery(this.dropdownApp.nativeElement).dropdown({
      onChange: value => {
        this.filterAssignedType = value;
        this.fetchSubscription(this.currentPage, false);
      }
    });
  }

  fetchSubscription(page: number = this.currentPage, force: boolean = true) {
    this.currentPage = page;
    const subscriptionsWaiter = this.subscriptionService.getSubscriptions(force);
    const crComplianceWaiter = this.complianceService.getCrComplianceLicense();

    return this.msApps
      .getWithApps([subscriptionsWaiter, crComplianceWaiter])
      .then(([subscriptions, crComplianceLicense]: any) => {
        this.crComplianceLicense = crComplianceLicense;

        this.subscriptions = [];
        subscriptions.forEach((subscription: CRSubscription) => {
          try {
            if (
              this.filterConcurrentCalls != 0 &&
              subscription.plan.numOfConcurrentCall != this.filterConcurrentCalls
            ) {
              return;
            }

            if (this.filterAssignedType != 'all') {
              if (this.filterAssignedType == 'biz' && subscription.plan.name != 'number_of_bp_ext') {
                return;
              }

              if (
                this.filterAssignedType != 'biz' &&
                (subscription.assignedApp == undefined || subscription.assignedApp.indexOf(this.filterAssignedType) < 0)
              ) {
                return;
              }
            }

            if (subscription.assignedApp != undefined) {
              const app = this.msApps.getAppInfo(subscription.assignedApp);
              subscription.appLogo = app.appLogo;
              subscription.appName = app.appName;
            }

            this.getAssignedConfig(subscription);
          } catch (e) {}

          this.subscriptions.push(subscription);
        });
      });
  }

  getAssignedConfig(subscription: CRSubscription) {
    if (subscription.assignedTo == undefined) {
      return;
    }

    this.subscriptionService.getConfig(subscription).then(config => {
      subscription.assignedConfig = config;
      this.reload = !this.reload;
    });
  }

  getPageList(currentPage: number = 1) {
    return Pagination.getPageList(currentPage, this.maxPage);
  }

  openAssignModal(subscription) {
    this.streamService.next(
      new Stream(StreamId.SHOW_ASSIGN_MODAL, {
        subscription: Object.assign({}, subscription)
      })
    );
    event.preventDefault();
  }

  openBizPhoneModal(subscription) {
    const message = new ModalMessage(BizphoneModalComponent, {
      subscription,
      action: this.action
    });
    this.modalService.load(message);
    event.preventDefault();
  }

  openCrComplianceModal(subscription) {
    const message = new ModalMessage(ComplianceModalComponent, {
      subscription,
      action: this.action
    });
    this.modalService.load(message);
    event.preventDefault();
  }

  openSettingModal(subscription: CRSubscription) {
    if (subscription.assignedApp == undefined) {
      return false;
    }

    const appName = subscription.assignedApp.toLowerCase();
    // let appName = 'direct'

    let modal;
    if (appName.indexOf('virtual') >= 0) {
      modal = VirtuallineModalComponent;
    } else if (appName.indexOf('direct') >= 0) {
      modal = DirectlineModalComponent;
    } else if (appName.indexOf('sip') >= 0) {
      modal = SipModalComponent;
    }
    if (modal) {
      const message = new ModalMessage(modal, {
        subscription,
        action: this.action
      });
      this.modalService.load(message);
    }

    event.preventDefault();
    return true;
  }

  getAppSuite() {
    if (!this.user) {
      this.isAppV2 = false;
      return;
    }
    this.isAppV2 = true;
  }
}
