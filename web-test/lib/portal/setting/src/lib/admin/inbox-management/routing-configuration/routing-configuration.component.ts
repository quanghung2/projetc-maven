import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { OrganizationQuery, OrganizationService } from '@b3networks/api/auth';
import { CaseRouting, CaseRoutingQuery, CaseRoutingService, InboxesQuery, InboxesService } from '@b3networks/api/inbox';
import { MetaData, SCMetaDataQuery, SCMetaDataService } from '@b3networks/api/workspace';
import { B3_ORG_UUID, DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import {
  catchError,
  combineLatest,
  finalize,
  forkJoin,
  map,
  Observable,
  of,
  startWith,
  switchMap,
  takeUntil
} from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  StoreRoutingConfigComponent,
  StoreRoutingConfigData
} from './store-routing-config/store-routing-config.component';

class CaseRoutingMapping extends CaseRouting {
  inboxName: string;
  products: string[];
  types: string[];
  nameOrgs: string[];

  constructor(obj?: Partial<CaseRoutingMapping>) {
    super(obj);
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get displayType() {
    return !this.types || this.types?.length === 0 ? 'All' : this.types?.join(', ');
  }

  get displayProduct() {
    return !this.products || this.products?.length === 0 ? '*' : this.products?.join(', ');
  }

  get displayOrgs() {
    return this.sourceOrgUuids.indexOf('*') === -1 ? this.nameOrgs?.join(', ') : 'All';
  }
}

@Component({
  selector: 'b3n-routing-configuration',
  templateUrl: './routing-configuration.component.html',
  styleUrls: ['./routing-configuration.component.scss']
})
export class RoutingConfigurationComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  routings: CaseRouting[] = [];
  loading: boolean;
  dataSource: MatTableDataSource<CaseRoutingMapping> = new MatTableDataSource<CaseRoutingMapping>();

  displayedColumns = ['inboxUuid', 'inboxName', 'type', 'products', 'orgs', 'domain', 'actions'];
  isB3: boolean;
  placeholderSearch = '';
  filterGroup = this.fb.group({
    search: '',
    typeId: 'All',
    productId: 'All'
  });
  type$: Observable<MetaData[]> = this.caseMetadataQuery.typeList$;
  product$: Observable<MetaData[]> = this.caseMetadataQuery.productList$;

  private defaultList: CaseRoutingMapping[] = [];

  constructor(
    private dialog: MatDialog,
    private caseRoutingService: CaseRoutingService,
    private caseRoutingQuery: CaseRoutingQuery,
    private inboxesService: InboxesService,
    private inboxesQuery: InboxesQuery,
    private caseMetadataQuery: SCMetaDataQuery,
    private caseMetadataService: SCMetaDataService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private toastService: ToastService,
    private organizationService: OrganizationService,
    private organizationQuery: OrganizationQuery
  ) {
    super();
  }

  ngOnInit() {
    this.isB3 = X.orgUuid === B3_ORG_UUID;
    if (this.isB3) {
      this.displayedColumns = ['inboxUuid', 'inboxName', 'type', 'products', 'orgs', 'domain', 'actions'];
      this.placeholderSearch = 'Search inbox, organization, domain';
    } else {
      this.displayedColumns = ['inboxUuid', 'inboxName', 'type', 'products', 'orgs', 'actions'];
      this.placeholderSearch = 'Search inbox, organization';
    }

    this.loading = true;
    forkJoin([
      this.caseRoutingService.getAll().pipe(
        catchError(() => of(null)),
        switchMap(routings => {
          let orgUuids: string[] = [];
          routings?.forEach(item => {
            if (item?.sourceOrgUuids?.length > 0 && item.sourceOrgUuids.indexOf('*') === -1) {
              orgUuids = [...orgUuids, ...item.sourceOrgUuids];
            }
          });

          const uniqueOrgUuids = [...new Set(orgUuids)];
          return uniqueOrgUuids?.length > 0 ? this.organizationService.queryOrgsByUuid(uniqueOrgUuids) : of(null);
        })
      ),
      this.inboxesService.getAll().pipe(catchError(() => of(null))),
      this.caseMetadataService.getCaseMetadata().pipe(catchError(() => of(null)))
    ])
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(() => this.initApp());
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  saveOrUpdate(routing: CaseRouting) {
    this.dialog
      .open(StoreRoutingConfigComponent, {
        data: <StoreRoutingConfigData>{
          isCreate: !routing,
          routing: routing
        },
        width: '500px',
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.refresh();
        }
      });
  }

  deleteRouing(item: CaseRoutingMapping) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '50rem',
        data: <ConfirmDialogInput>{
          title: 'Delete number',
          message: `Are you sure you want to delete this routing?`,
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.caseRoutingService.deleteRouting(item.id).subscribe(
            _ => {},
            err => this.toastService.error(err.message)
          );
        }
      });
  }

  refresh() {
    this.loading = true;
    this.caseRoutingService
      .getAll()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe();
  }

  private initApp() {
    combineLatest([
      this.caseRoutingQuery.selectAll(),
      this.inboxesQuery.selectAll(),
      this.caseMetadataQuery.select().pipe(filter(x => !!x))
    ])
      .pipe(
        map(([routings, inboxes, metadata]) => {
          return routings?.map(routing => {
            const productMapping = routing.productIds
              .map(id => metadata?.productList?.find(x => x.id === +id)?.name)
              .filter(x => !!x);
            const typeMapping = routing.typeIds
              .map(id => metadata?.caseTypeList?.find(x => x.id === +id)?.name)
              .filter(x => !!x);
            const inboxName = inboxes.find(x => x.uuid === routing.inboxUuid)?.name;
            const nameOrgs = routing.sourceOrgUuids
              ?.map(x => this.organizationQuery.getEntity(x)?.name)
              ?.filter(x => !!x);
            return new CaseRoutingMapping(<CaseRoutingMapping>{
              ...routing,
              products: productMapping,
              types: typeMapping,
              inboxName: inboxName,
              nameOrgs: nameOrgs
            });
          });
        }),
        switchMap(routings => {
          this.defaultList = routings;
          return combineLatest([of(routings), this.filterGroup.valueChanges.pipe(startWith(this.filterGroup.value))]);
        }),
        map(([routings, filter]) => {
          return routings.filter(routing => {
            const text = filter?.search?.trim();
            const includeText = text
              ? routing.inboxUuid === text ||
                routing.inboxName?.toLowerCase().includes(text?.toLowerCase()) ||
                routing?.displayOrgs?.toLowerCase().includes(text?.toLowerCase()) ||
                routing?.sourceDomainUuids?.some(x => x?.toLowerCase().indexOf(text?.toLowerCase()) > -1) ||
                routing.sourceOrgUuids?.some(x => x === text)
              : true;
            const isProduct =
              filter.productId === 'All' || routing.productIds?.some(x => x === filter.productId?.toString());
            const isType = filter.typeId === 'All' || routing.typeIds?.some(x => x === filter.typeId?.toString());
            return includeText && isProduct && isType;
          });
        }),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(routings => {
        this.updateDataSource(routings);
      });
  }

  private updateDataSource(data: CaseRoutingMapping[]) {
    this.dataSource.data = data;
    this.dataSource.paginator = this.paginator;
    this.cdr.detectChanges();
  }
}
