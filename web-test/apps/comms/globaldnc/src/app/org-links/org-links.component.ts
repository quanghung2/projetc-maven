import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CacheService } from '../shared/service/cache.service';
import { EventStreamService } from '../shared/service/event-stream.service';
import { ListManagementService } from '../shared/service/list-management.service';

declare var X: any;

@Component({
  selector: 'app-org-links',
  templateUrl: './org-links.component.html',
  styleUrls: ['./org-links.component.scss']
})
export class OrgLinksComponent implements OnDestroy {
  loading: boolean;
  masterOrg: any;
  slaveOrgs: string;
  entries: any[];
  subscriptionInfo: any;
  subscriptions = new Array<Subscription>();

  constructor(
    private cacheService: CacheService,
    private eventStreamService: EventStreamService,
    private listManagementService: ListManagementService,
  ) {
    this.subscriptions.push(
      this.eventStreamService.on('org-links:delete-slave').subscribe(e => {
        this.listManagementService.deleteOrgLink(e.uuid).subscribe(
          res => {
            this.loading = true;
            this.eventStreamService.trigger('hide-confirmation');
            this.get();
            X.showSuccess('Delete successfully');
          },
          err => {
            this.eventStreamService.trigger('hide-confirmation');
            X.showWarn(`Cannot delete because ${err.message.toLowerCase()}`);
          }
        );
      })
    );

    if (this.cacheService.containKey('subscription-info')) {
      this.subscriptionInfo = this.cacheService.get('subscription-info');

      if (this.subscriptionInfo) {
        if (this.subscriptionInfo.isChild) {
          this.getMaster();
        } else {
          this.get();
        }
      }
    }
  }

  ngOnDestroy() {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }

  get() {
    this.loading = true;
    this.listManagementService.getAllOrgLink().subscribe(
      res => {
        this.loading = false;
        this.entries = res;
      },
      err => {
        this.loading = false;
        X.showWarn(`Cannot get all org links because ${err.message.toLowerCase()}`);
      }
    );
  }

  getMaster() {
    this.loading = true;
    this.listManagementService.getMasterOrg().subscribe(
      res => {
        this.loading = false;
        this.masterOrg = res;
      },
      err => {
        this.loading = false;
        X.showWarn(`Cannot get all org links because ${err.message.toLowerCase()}`);
      }
    );
  }

  update() {
    if (this.slaveOrgs && !!this.slaveOrgs.trim()) {
      const orgs = this.slaveOrgs.toLowerCase().split(/[\s,;\t\n]+/);
      this.listManagementService.updateOrgLink(orgs).subscribe(
        res => {
          this.loading = true;
          this.get();
          this.slaveOrgs = '';
          X.showSuccess(`Add ${orgs.length} org(s) successfully`);
        },
        err => {
          X.showWarn(`Cannot add because ${err.message.toLowerCase()}`);
        }
      );
      return;
    }

    X.showWarn('Organization uuid is required!');
  }

  delete(uuid: string) {
    this.eventStreamService.trigger('show-confirmation', {
      title: 'Delete',
      message: `Are you sure you want to remove this org ${uuid} out of your org link list?`,
      type: 'yesno',
      okEvent: {
        event: 'org-links:delete-slave',
        data: {
          uuid: uuid
        }
      },
      cancelEvent: {}
    });
  }
}
