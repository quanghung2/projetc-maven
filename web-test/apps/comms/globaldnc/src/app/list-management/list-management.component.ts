import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CacheService } from '../shared/service/cache.service';
import { EventStreamService } from '../shared/service/event-stream.service';
import { ListManagementService } from '../shared/service/list-management.service';

declare let X: any;

@Component({
  selector: 'list-management',
  templateUrl: './list-management.component.html',
  styleUrls: ['./list-management.component.scss']
})
export class ListManagementComponent implements OnDestroy {
  loading = false;
  searching = false;
  searchStr = '';
  subscriptionInfo: any;
  pagination: any = {
    currentPage: 1,
    perPage: 10
  };
  searchResult: any = {
    totalCount: 0,
    entries: []
  };
  subscriptions = new Array<Subscription>();

  constructor(
    private cacheService: CacheService,
    private eventStreamService: EventStreamService,
    private listManagementService: ListManagementService
  ) {
    this.search();

    this.subscriptions.push(
      this.eventStreamService.on('list-management:reload').subscribe(e => {
        this.loading = true;
        this.search();
      })
    );

    this.subscriptions.push(
      this.eventStreamService.on('list-management:change-consent-status').subscribe(e => {
        this.listManagementService.update(e.number, e.type, e.new).subscribe(
          res => {
            this.searching = true;
            this.eventStreamService.trigger('hide-confirmation');
            this.search();
          },
          res => {
            this.eventStreamService.trigger('hide-confirmation');
            X.showWarn(`Cannot update status because ${res.message.toLowerCase()}`);
          }
        );
      })
    );

    this.subscriptions.push(
      this.eventStreamService.on('list-management:delete-consent-number').subscribe(e => {
        this.listManagementService.delete(e.number).subscribe(
          res => {
            this.searching = true;
            this.eventStreamService.trigger('hide-confirmation');
            this.search();
          },
          res => {
            this.eventStreamService.trigger('hide-confirmation');
            X.showWarn(`Cannot delete because ${res.message.toLowerCase()}`);
          }
        );
      })
    );

    if (this.cacheService.containKey('subscription-info')) {
      this.subscriptionInfo = this.cacheService.get('subscription-info');
    }
  }

  ngOnDestroy() {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }

  changePage(page: number) {
    this.pagination.currentPage = page;
    this.search();
  }

  search() {
    this.searching = true;
    this.listManagementService
      .search({
        pagination: this.pagination,
        searchStr: this.searchStr
      })
      .subscribe(
        res => {
          this.searchResult.totalCount = res.totalCount;
          this.searchResult.entries = res.entries;
          this.searching = false;
        },
        res => {
          this.searching = false;
          X.showWarn(`Cannot search because ${res.message.toLowerCase()}`);
        }
      );
  }

  export() {
    this.eventStreamService.trigger('show-export-consent');
  }

  changeStatus(type, e, newStatus) {
    let oldStatus = e.voice;
    if (type == 'fax') {
      oldStatus = e.fax;
    } else if (type == 'sms') {
      oldStatus = e.sms;
    }
    this.eventStreamService.trigger('show-confirmation', {
      title: 'Change status',
      message: `${type} status of ${e.number} is currently ${oldStatus}. Are you sure you want to change to ${newStatus}?`,
      type: 'yesno',
      okEvent: {
        event: 'list-management:change-consent-status',
        data: {
          type: type,
          number: e.number,
          old: oldStatus,
          new: newStatus
        }
      },
      cancelEvent: {}
    });
  }

  delete(e) {
    this.eventStreamService.trigger('show-confirmation', {
      title: 'Delete',
      message: `Are you sure you want to remove destination ${e.number} out of your consent list?`,
      type: 'yesno',
      okEvent: {
        event: 'list-management:delete-consent-number',
        data: {
          number: e.number
        }
      },
      cancelEvent: {}
    });
  }

  openAddConsentNumberModal() {
    this.eventStreamService.trigger('show-add-consent-number');
  }

  isPrimary() {
    return this.subscriptionInfo && this.subscriptionInfo.isChild === false;
  }

  canEdit() {
    return this.isPrimary() && this.subscriptionInfo.enableTokenization === false;
  }
}
