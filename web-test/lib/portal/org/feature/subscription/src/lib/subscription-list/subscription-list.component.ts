import { SelectionModel } from '@angular/cdk/collections';
import { Component, EventEmitter, Inject, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { IAM_SERVICES, IAM_UI_ACTIONS, OrganizationPolicyQuery, OrgMemberQuery } from '@b3networks/api/auth';
import { Pageable } from '@b3networks/api/common';
import { PortalConfig } from '@b3networks/api/partner';
import {
  FindSubscriptionReq,
  Subscription,
  SubscriptionService,
  SUBSCRIPTION_PAGINATOR
} from '@b3networks/api/subscription';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { PaginationResponse, PaginatorPlugin } from '@datorama/akita';
import { Observable } from 'rxjs';
import { filter, switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'pos-subscription-list',
  templateUrl: './subscription-list.component.html',
  styleUrls: ['./subscription-list.component.scss']
})
export class SubscriptionListComponent extends DestroySubscriberComponent implements OnInit, OnChanges, OnDestroy {
  @Input() status: string;
  @Input() productId: string;
  @Input() assignee: string;
  @Output() viewSubDetail: EventEmitter<void> = new EventEmitter();

  portalConfig: PortalConfig;
  displayedColumns: string[] = [];
  selection = new SelectionModel<Subscription>(false, null);
  pageable: Pageable = <Pageable>{ page: 1, perPage: 10 };
  subscription$: Observable<PaginationResponse<Subscription>>;

  constructor(
    @Inject(SUBSCRIPTION_PAGINATOR) public paginatorRef: PaginatorPlugin<Subscription>,
    private toastr: ToastService,
    private orgMemberQuery: OrgMemberQuery,
    private subscriptionService: SubscriptionService,
    private organizationPolicyQuery: OrganizationPolicyQuery
  ) {
    super();
  }

  /**
   * User will show resource on
   * ui:ShowSubscriptionColumn:["uuid", "productName", "numbers", "skuName", "renewDate", "renewalPrice", "users"]
   * but need support resources: [*]
   */
  ngOnInit(): void {
    this.organizationPolicyQuery
      .selectGrantedIAM(X.orgUuid, IAM_SERVICES.ui, IAM_UI_ACTIONS.show_subscription_column)
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(iam => iam != null)
      )
      .subscribe(iam => {
        if (iam.isAllowedAllResources) {
          this.displayedColumns = ['uuid', 'productName', 'numbers', 'skuName', 'renewDate', 'renewalPrice', 'users'];
        } else {
          this.displayedColumns = iam.resources;
        }
      });

    this.subscription$ = <Observable<PaginationResponse<Subscription>>>this.paginatorRef.pageChanges.pipe(
      switchMap(page => {
        const subscriptionReq = new FindSubscriptionReq({
          statuses: this.status,
          productIds: this.productId ? [this.productId] : [],
          assignee: this.assignee,
          embed: ['numbers', 'assignees', 'prices']
        });

        const requestFn = () =>
          this.subscriptionService.findSubscriptions(subscriptionReq, this.pageable, { usingPaginationPlugin: true });
        return this.paginatorRef.getPage(requestFn);
      })
    );
  }

  override ngOnDestroy() {
    this.paginatorRef.destroy();
  }

  ngOnChanges(): void {
    this.paginatorRef.clearCache();
    this.pageable.page = 1;
    this.paginatorRef.setFirstPage();
  }

  getFirstAssigneeName(id: string) {
    const member = this.orgMemberQuery.getAll().find(m => m.uuid === id);
    return member ? member.displayName : '--';
  }

  refreshList() {
    this.paginatorRef.clearCache();
    this.paginatorRef.refreshCurrentPage();
  }

  copied() {
    this.toastr.success('Copied to clipboard');
  }

  viewDetails(e: Subscription) {
    this.subscriptionService.setActive(e.uuid);
    this.viewSubDetail.emit();
  }

  changePage(page?: number) {
    if (page > -1) {
      this.pageable.page = page;
    }
    this.paginatorRef.setPage(page);
  }
}
