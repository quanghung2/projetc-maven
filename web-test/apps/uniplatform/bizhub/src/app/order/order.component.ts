import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import {
  ActionMapping,
  AdminOpsService, IAM_GROUP_UUIDS,
  IamQuery,
  IdentityProfileQuery,
  Member,
  Organization,
  OrganizationService,
  PromoteEntityType,
  PromoteReq,
  RealDomainService
} from '@b3networks/api/auth';
import { Pageable } from '@b3networks/api/common';
import { GetOrderReq, Order, OrderQuery, OrderService, OrderStatus } from '@b3networks/api/license';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, debounceTime, mergeMap, takeUntil, tap } from 'rxjs/operators';
import { AppState } from '../state/app-state.model';
import { AppStateQuery } from '../state/app-state.query';
import { AppStateService } from '../state/app-state.service';
import { StoreOrderComponent, StoreOrderInput } from './store-order/store-order.component';

const InitData = {
  filter: {
    statuses: [
      { key: '', value: 'All' },
      { key: OrderStatus.pending, value: 'Pending' },
      { key: OrderStatus.approved, value: 'Approved' },
      { key: OrderStatus.rejected, value: 'Rejected' }
    ]
  }
};

@Component({
  selector: 'b3n-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent extends DestroySubscriberComponent implements OnInit {
  readonly displayedColumns = ['id', 'customerUuid', 'customerName', 'status', 'updatedAt', 'actions'];
  readonly InitData = InitData;
  readonly OrderStatus = OrderStatus;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource = new MatTableDataSource<Order>();

  orgsMap: HashMap<Organization> = {}; // with key is orgUuid

  filterFG: UntypedFormGroup;

  loading$: Observable<boolean>;
  pageable: Pageable = { page: 0, perPage: 10 };
  totalCount: number;
  member: Member;
  actionMapping$: Observable<ActionMapping>;

  constructor(
    private orderQuery: OrderQuery,
    private orderService: OrderService,
    private realDomainService: RealDomainService,
    private orgService: OrganizationService,
    private adminOpsService: AdminOpsService,
    private appStateQuery: AppStateQuery,
    private appStateService: AppStateService,
    private fb: UntypedFormBuilder,
    private dialog: MatDialog,
    private toastr: ToastService,
    private iamQuery: IamQuery,
    private profileQuery: IdentityProfileQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.actionMapping$ = this.iamQuery.selectActionMapping(IAM_GROUP_UUIDS.businessHub);

    this.initForm();
    this.orderQuery.orders$
      .pipe(
        takeUntil(this.destroySubscriber$),
        mergeMap(async orders => {
          const orgUuids = [
            ...new Set(orders.map(o => (o.orgUuid in this.orgsMap ? null : o.orgUuid)).filter(u => !!u))
          ];

          const streams = orgUuids.map(uuid =>
            this.orgService.getOrganizationByUuid(uuid).pipe(catchError(_ => of(null)))
          );
          if (streams.length) {
            const orgs = await forkJoin(streams).toPromise();
            orgs.filter(o => o != null).forEach(o => (this.orgsMap[o.uuid] = o));
          }

          return orders;
        }),
        tap(data => {
          this.dataSource.data = data;
        })
      )
      .subscribe();

    this.loading$ = this.orderQuery.selectLoading();
    this.refreshPage();

    this.realDomainService
      .getRealDomainFromPortalDomain()
      .pipe(
        mergeMap(result => {
          return this.adminOpsService.promote(<PromoteReq>{
            entityType: PromoteEntityType.domain,
            entityUuid: result.domain
          });
        })
      )
      .subscribe();
  }

  refreshPage() {
    const req = { ...this.filterFG.value } as GetOrderReq;

    req.statuses = !!req['status'] ? [req['status']] : [];
    delete req['status'];

    this.orderService.get(req, this.pageable).subscribe(page => {
      this.totalCount = page.totalCount;
    });
  }

  createOrUpdate(order?: Order) {
    this.dialog.open(StoreOrderComponent, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      data: <StoreOrderInput>{
        order: order,
        type: order ? 'update' : 'create'
      },
      autoFocus: false
    });
  }

  deleteOrder(order: Order) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '560px',
        data: <ConfirmDialogInput>{
          title: `Delete order`,
          message: `This action cannot be revert, are you sure to delete order <strong>${order.id}</strong>? `,
          confirmLabel: `Delete`,
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.orderService.remove(order.id).subscribe(
            _ => {
              this.toastr.success(`Delete order successfully.`);
            },
            error => {
              this.toastr.warning(error.message);
            }
          );
        }
      });
  }

  approve(order: Order) {
    this.dialog.open(StoreOrderComponent, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      data: <StoreOrderInput>{
        order: order,
        type: 'approve'
      },
      autoFocus: false
    });
  }

  viewDetails(order: Order) {
    this.dialog.open(StoreOrderComponent, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      data: <StoreOrderInput>{
        order: order,
        type: 'view'
      },
      autoFocus: false
    });
  }

  private initForm() {
    const initFilter = this.appStateQuery.orderFilter;
    this.filterFG = this.fb.group({
      buyerUuid: initFilter?.buyerUuid || null,
      status: initFilter.status || ''
    });

    this.filterFG.valueChanges.pipe(debounceTime(200)).subscribe(filter => {
      this.pageable.page = 0;
      this.refreshPage();
      this.appStateService.updateFilter(<AppState>{ orderFilter: filter });
    });
  }

  onPageChange(event: PageEvent) {
    this.pageable.page = event.pageIndex;
    this.refreshPage();
  }
}
