import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { Pageable } from '@b3networks/api/common';
import { IsdnNumber, IsdnNumberQuery, IsdnNumberService } from '@b3networks/api/sim';
import { FindSubscriptionReq, ProductFeature, Subscription, SubscriptionService } from '@b3networks/api/subscription';
import { DestroySubscriberComponent, ISDN_PRODUCT } from '@b3networks/shared/common';
import { EventMessageService } from '@b3networks/shared/utils/message';
import { forkJoin } from 'rxjs';
import { debounceTime, filter, take } from 'rxjs/operators';
import { RIGHT_SIDEBAR_ID } from '../../shared/contants';
import { ComplianceEvent } from '../compliance-event';

const PER_PAGE_SIZE = 10;

@Component({
  selector: 'b3n-sim-compliance',
  templateUrl: './sim-compliance.component.html',
  styleUrls: ['./sim-compliance.component.scss']
})
export class SimComplianceComponent extends DestroySubscriberComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  readonly PER_PAGE_SIZE = PER_PAGE_SIZE;
  readonly RIGHT_SETTING_SIDEBAR_ID = RIGHT_SIDEBAR_ID;

  searchTextForm = new UntypedFormControl();
  selectNumber: IsdnNumber;
  columns = ['number', 'dncAction', 'consentAction', 'crConfig', 'status'];
  pageable = <Pageable>{ page: 0, perPage: PER_PAGE_SIZE };
  dataSource: MatTableDataSource<IsdnNumber> = new MatTableDataSource([]);

  subs: Subscription[];
  allowEdit = {
    dnc: false,
    cr: false
  };

  constructor(
    private isdnNumberService: IsdnNumberService,
    private isdnNumberQuery: IsdnNumberQuery,
    private subscriptionService: SubscriptionService,
    private identityProfileQuery: IdentityProfileQuery,
    private eventService: EventMessageService
  ) {
    super();
  }

  ngOnInit(): void {
    this.identityProfileQuery.profile$
      .pipe(
        filter(i => i != null),
        take(1)
      )
      .subscribe(profile => {
        forkJoin([
          this.isdnNumberService.get(),
          this.subscriptionService.findSubscriptions(
            new FindSubscriptionReq({
              embed: ['features'],
              assignee: profile.uuid
            }),
            { page: 1, perPage: 1000 },
            { usingPaginationPlugin: true }
          )
        ]).subscribe(([data, subs]) => {
          this.dataSource.data = data;
          this.subs = subs.data;

          let features: ProductFeature[] = [];

          subs.data.forEach(s => {
            s.items.forEach(i => {
              features = [...features, ...i.features];
            });
          });
          this.allowEdit = {
            dnc: features.some(x => x.featureCode === ISDN_PRODUCT.mobileEnterpriseDnc),
            cr: features.some(x => x.featureCode === ISDN_PRODUCT.mobileEnterpriseCr)
          };
        });
      });

    this.searchTextForm.valueChanges.pipe(debounceTime(300)).subscribe(value => {
      this.onSearchNumber(value);
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  onUpdated() {
    this.onSearchNumber(this.searchTextForm.value, this.paginator.pageIndex);
  }

  private onSearchNumber(searchTeam: string, pageIndex: number = 1) {
    const value = searchTeam?.trim()?.toLowerCase();
    this.dataSource.paginator.pageIndex = pageIndex;
    this.dataSource.data = this.isdnNumberQuery.searchISDNNumbersByNumber(value);
  }

  showDetail(item: IsdnNumber, event: Event) {
    event.stopPropagation();
    this.selectNumber = item;
    this.eventService.sendMessage(<ComplianceEvent>{ showRightSidebar: true });
  }

  closeSidebar() {
    this.eventService.sendMessage(<ComplianceEvent>{ showRightSidebar: false });
  }
}
