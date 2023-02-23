import { Component, OnInit } from '@angular/core';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AppType, CRSubscription, MsApps, SubscriptionService } from '../../shared';
import { BaseModalComponent } from '../../shared/base-modal.component';
import { Stream, StreamId, StreamService } from '../../shared/service/stream.service';

declare let jQuery: any;

@Component({
  selector: 'app-assign-modal',
  templateUrl: './assign-modal.component.html',
  styleUrls: ['./assign-modal.component.css']
})
export class AssignModalComponent extends BaseModalComponent implements OnInit {
  public subscription: CRSubscription;

  public appIds: Object = environment.app.apps;
  public apps: Object = {};
  public assignedTo: any;

  public assignees: Array<Object>;
  public isLoading = false;

  public modalId = '#assign-modal';

  constructor(
    private subscriptionService: SubscriptionService,
    private msApps: MsApps,
    private streamService: StreamService
  ) {
    super();
  }

  ngOnInit() {
    this.subscription = new CRSubscription();
    this.subscriptions = [];

    const subscription1 = this.streamService
      .getStream()
      .pipe(filter(stream => stream.id == StreamId.SHOW_ASSIGN_MODAL))
      .subscribe((stream: Stream) => {
        this.subscription = stream.data.subscription;
        this.fetchNumbers();
        this.showModal(this.modalId);
      });

    this.subscriptions.push(subscription1);
  }

  loadDropdown() {
    jQuery('#assign-dropdown').dropdown({
      noResults: 'Loading...',
      fullTextSearch: true,
      onChange: value => {
        value = value.trim();
        const assigns: any = this.assignees.filter((assign: any) => assign.assignTo == value);
        if (assigns.length > 0) {
          this.assignedTo = assigns[0];
        }
      }
    });
  }

  fetchNumbers() {
    const assignWaiter = this.subscriptionService.getNumbers();

    return this.msApps.getWithApps([assignWaiter]).then(([assignees, apps]: any) => {
      this.assignees = [];
      // parse logo
      assignees.forEach((assign: any) => {
        if (assign.numOfConcurrentCall < 0) {
          assign.numOfConcurrentCall = 30;
        }
        if (this.subscription.plan.numOfConcurrentCall < assign.numOfConcurrentCall) {
          return;
        }

        if (assign.assignApp == AppType.SIP) {
          const appId = this.appIds['sip'];
          assign.appLogo = apps[appId].iconUrl;
          assign.appName = 'SIP';
        } else if (assign.assignApp == AppType.VIRTUAL_LINE) {
          const appId = this.appIds['virtualline'];
          assign.appLogo = apps[appId].iconUrl;
          assign.appName = 'Virtual Line';
        } else if (assign.assignApp == AppType.DIRECT_LINE) {
          const appId = this.appIds['directline'];
          assign.appLogo = apps[appId].iconUrl;
          assign.appName = 'Direct Line';
        } else if (assign.assignApp == AppType.BIZ_PHONE) {
          const appId = this.appIds['bizphone'];
          assign.appLogo = apps[appId].iconUrl;
          assign.appName = 'Biz Phone';
        }

        assign.appPlan = this.parseRecordingPlan(assign);

        this.assignees.push(assign);
      });
      this.loadDropdown();
    });
  }

  parseRecordingPlan(assign: any) {
    if (assign.numOfConcurrentCall < 0 || assign.numOfConcurrentCall >= 30) {
      return 'Business Ultimate';
    }
    if (assign.numOfConcurrentCall >= 10) {
      return 'Business Plus';
    }
    if (assign.numOfConcurrentCall >= 5) {
      return 'Business';
    }
    if (assign.numOfConcurrentCall >= 2) {
      return 'Professional';
    }

    return '';
  }

  onUnassign() {
    delete this.subscription.assignedTo;
    delete this.subscription.assignedApp;
    delete this.assignedTo;
  }

  onSave() {
    let waiter;
    if (this.assignedTo == undefined && this.subscription.assignedTo == undefined) {
      waiter = this.subscriptionService.unassignNumber(this.subscription.uuid);
    } else {
      waiter = this.subscriptionService.assignNumber(this.subscription.uuid, this.assignedTo);
    }

    this.isLoading = true;
    waiter.then(() => {
      this.isLoading = false;
      this.hideModal(this.modalId);

      this.streamService.next(new Stream(StreamId.REFRESH_SUBSCRIPTIONS, {}));
    });
  }
}
