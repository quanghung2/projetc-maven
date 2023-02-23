import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Subscription } from 'rxjs';
import { CacheService, EventStreamService, RoutingConfigModel, RoutingService } from '../../shared';

export enum EnumTypeRouting {
  isdn_incoming = 'isdn_incoming',
  outgoing = 'outgoing',
  all = 'all'
}

declare var X: any;

@Component({
  selector: 'app-routing-config',
  templateUrl: './routing-config.component.html',
  styleUrls: ['./routing-config.component.scss']
})
export class RoutingConfigComponent implements OnInit, OnDestroy {
  readonly EnumTypeRouting = EnumTypeRouting;
  public loading = false;
  public currentAccount: any = {};
  listRoutings: RoutingConfigModel[] = [];
  perPage = 10;
  page = 1;
  listViewData: RoutingConfigModel[] = [];
  keyword: string;
  selectedType = EnumTypeRouting.all;

  private arrSubscription = new Array<Subscription>();

  constructor(
    private eventStreamService: EventStreamService,
    private cacheService: CacheService,
    private routingService: RoutingService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    const cur = this.cacheService.get('current-account');
    if (cur) {
      this.loadInfo(cur);
    }

    this.arrSubscription.push(
      this.eventStreamService.on('switched-account').subscribe(res => {
        this.loadInfo(res);
      })
    );

    this.eventStreamService.on('delete-routing').subscribe(
      res => {
        if (res) {
          this.routingService.deleteRouting(res.username, res.routing).subscribe(
            () => {
              this.toastService.success('This routing was deleted');
              this.loadInfo(res.currentAccount);
              this.eventStreamService.trigger('close-modal', 'confirmation-modal');
            },
            err => {
              this.toastService.error('Cannot delete this routing');
            }
          );
        }
      },
      err => {
        this.toastService.error('Cannot delete this routing');
      }
    );

    this.arrSubscription.push(
      this.eventStreamService.on('close-modal:add-routing-modal').subscribe(data => {
        this.listRoutings.unshift(data);

        this.search();
      })
    );
  }

  ngOnDestroy(): void {
    this.arrSubscription.forEach(sub => {
      sub.unsubscribe();
    });
  }

  getDataByPage(page: number) {
    this.listViewData = [...this.listRoutings].splice((page - 1) * this.perPage, this.perPage);
  }

  onPageChanged($event) {
    this.page = $event;
    this.getDataByPage(this.page);
  }

  add() {
    this.eventStreamService.trigger('open-modal', 'add-routing-modal');
  }

  private loadInfo(curAcc) {
    this.loading = true;
    this.currentAccount = curAcc;
    this.routingService.getRoutings(this.currentAccount.account.username).subscribe((data: RoutingConfigModel[]) => {
      this.listRoutings = data;
      this.getDataByPage(this.page);
    });
  }

  deleteRouting(routing: RoutingConfigModel) {
    this.eventStreamService.trigger('show-confirmation', {
      title: 'Delete routing',
      message: `Are you sure to delete this routing ? </b>`,
      type: 'yesno',
      okEvent: {
        event: 'delete-routing',
        data: {
          routing: routing,
          username: this.currentAccount.account.username,
          currentAccount: this.currentAccount
        }
      },
      cancelEvent: {}
    });
  }

  search() {
    const sipUsername = this.currentAccount.account.username;
    this.routingService.getRoutings(sipUsername, this.keyword).subscribe(routings => {
      if (this.selectedType !== EnumTypeRouting.all) {
        this.listRoutings = routings.filter(routing => routing.type === this.selectedType);
      } else {
        this.listRoutings = routings;
      }

      this.page = 1;
      this.getDataByPage(this.page);
    });
  }

  resetSearchQuery() {
    this.keyword = '';
    this.search();
  }

  changeType(type: EnumTypeRouting) {
    this.selectedType = type;
    this.search();
  }
}
