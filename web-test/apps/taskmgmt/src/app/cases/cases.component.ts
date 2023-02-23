import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { Pageable } from '@b3networks/api/common';
import {
  Case,
  CaseQuery,
  CaseService,
  CaseStatus,
  CASE_PAGINATOR,
  CollaboratorRole,
  QueryCaseReq,
  User
} from '@b3networks/api/workspace';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { PaginationResponse, PaginatorPlugin } from '@datorama/akita';
import { Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, switchMap, takeUntil, tap } from 'rxjs/operators';
import { CaseFiltering, SearchBy } from '../settings/filter-setting.model';
import { FilterSettingQuery } from '../settings/filter-setting.query';
import { FilterSettingService } from '../settings/filter-setting.service';

const TAB_INDEX_MAPPING = { 0: 'assigned2me', 1: 'internal', 2: 'external' };
const TAB_NAME_INDEX_MAPPING = { assigned2me: 0, internal: 1, external: 2 };

@Component({
  selector: 'b3n-cases',
  templateUrl: './cases.component.html',
  styleUrls: ['./cases.component.scss']
})
export class CasesComponent extends DestroySubscriberComponent implements OnInit {
  readonly displayedColumns: string[] = ['title', 'status', 'dueAt', 'createdAt', 'createdBy', 'action'];
  readonly tabs = [
    { index: 0, label: 'My Cases' },
    { index: 1, label: 'Internal Cases' },
    { index: 2, label: 'External  Cases' }
  ];

  filterSetting: CaseFiltering = this.filterSettingQuery.getFilter();
  selectedTabIndex = TAB_NAME_INDEX_MAPPING[this.filterSetting.activeTab];

  statuses = [
    { key: CaseStatus.open, value: 'Open', count: 0 },
    { key: CaseStatus.closed, value: 'Closed', count: 0 },
    { key: 'all', value: 'All', count: 0 }
  ];

  statusFC = new FormControl<CaseStatus | 'all'>(this.filterSettingQuery.getFilter().status);

  casePage$: Observable<PaginationResponse<Case>>;

  pageable = <Pageable>{ page: 1, perPage: 20 };
  mobileQuery: MediaQueryList;
  isLoading = false;

  constructor(
    @Inject(CASE_PAGINATOR) public paginatorRef: PaginatorPlugin<Case>,
    private caseQuery: CaseQuery,
    private caseService: CaseService,
    private route: ActivatedRoute,
    private router: Router,
    private filterSettingQuery: FilterSettingQuery,
    private filterSettingService: FilterSettingService,
    media: MediaMatcher,
    changeDetectorRef: ChangeDetectorRef
  ) {
    super();
    this.mobileQuery = media.matchMedia('(max-width: 768px)');
    this.mobileQuery.addListener(() => changeDetectorRef.detectChanges());
    this.navigateModule();

    const storeValue = this.caseQuery.getValue();
    this.statuses = [
      { key: CaseStatus.open, value: 'Open', count: storeValue.openCount || 0 },
      { key: CaseStatus.closed, value: 'Closed', count: storeValue.closedCount || 0 },
      { key: 'all', value: 'All', count: storeValue.totalCount || 0 }
    ];

    this.statusFC.valueChanges
      .pipe(
        distinctUntilChanged(),
        tap((status: CaseStatus | 'all') => {
          if (status === 'all') {
            status = null;
          }

          this.filterSettingService.updateFilterSetting({ status: status as CaseStatus });
        })
      )
      .subscribe();
  }

  ngOnInit(): void {
    this.filterSetting = this.filterSettingQuery.getFilter();
    this.selectedTabIndex = TAB_NAME_INDEX_MAPPING[this.filterSetting.activeTab];

    this.filterSettingQuery.caseFilter$
      .pipe(distinctUntilChanged(), takeUntil(this.destroySubscriber$))
      .subscribe(filter => {
        console.log(filter);
        this.filterSetting = filter;
        this.pageable.page = 1;
        this.paginatorRef.clearCache();
        this.paginatorRef.setFirstPage();
      });

    this.casePage$ = <Observable<PaginationResponse<Case>>>this.paginatorRef.pageChanges.pipe(
      switchMap(() => {
        console.log(`page changed event trigged`);

        this.isLoading = true;

        const filter = this.filterSettingQuery.getValue();
        const req = <QueryCaseReq>{
          status: filter.status || null
        };

        if (filter.activeTab === 'internal') {
          req.collaboratorRoles = [CollaboratorRole.creator, CollaboratorRole.owner];
        } else if (filter.activeTab === 'external') {
          req.collaboratorRoles = [CollaboratorRole.participant];
        }
        if (filter.activeTab !== 'assigned2me' && filter.memberFiltering) {
          req.assignee = filter.memberFiltering.uuid;
        }

        const keyword = filter.searchQuery?.value;
        if (keyword) {
          switch (filter.searchQuery.type) {
            case SearchBy.domain:
              req.srcDomain = keyword;
              break;
            case SearchBy.orgUuid:
              req.srcOrgUuid = keyword;
              break;
            case SearchBy.id:
              req.srcDomain = keyword;
              break;
            case SearchBy.titleDesc:
              req.textSearch = keyword;
              break;
            default:
              break;
          }
        }

        req.fields = ['created_by', 'severity', 'assignee', 'type'];

        const stream =
          filter.activeTab === 'assigned2me'
            ? this.caseService.queryAssigned2MeCases(req, this.pageable)
            : this.caseService.queryAllCases(req, this.pageable);
        const requestFn = () =>
          stream.pipe(
            catchError(() => of(<PaginationResponse<Case>>{ data: [] })),
            tap(() => {
              this.isLoading = false;
              const storeValue = this.caseQuery.getValue();
              this.statuses = [
                { key: CaseStatus.open, value: 'Open', count: storeValue.openCount || 0 },
                { key: CaseStatus.closed, value: 'Closed', count: storeValue.closedCount || 0 },
                { key: 'all', value: 'All', count: storeValue.totalCount || 0 }
              ];
            })
          );
        return this.paginatorRef.getPage(requestFn).pipe(
          tap(r => {
            this.isLoading = false;
          })
        );
      })
    );
  }

  protected override destroy(): void {
    this.paginatorRef.destroy();
  }

  refreshList() {
    this.paginatorRef.clearCache();
    this.paginatorRef.refreshCurrentPage();
  }

  changePage(page?: number) {
    console.log(`page changed to ${page}`);

    if (page > -1) {
      this.pageable.page = page;
    }
    this.paginatorRef.clearCache();
    this.paginatorRef.setPage(page);
  }

  onFilter(event) {
    this.filterSetting.memberFiltering = event.options[0]?._value ? event.options[0]._value : null;
    this.filterSettingService.updateFilterSetting({
      memberFiltering: this.filterSetting.memberFiltering
    });
  }

  onSelectedTabChange(event: MatTabChangeEvent) {
    this.selectedTabIndex = event.index;
    this.filterSettingService.updateFilterSetting({
      activeTab: TAB_INDEX_MAPPING[this.selectedTabIndex]
    });
  }

  filterByMember(member: User) {
    this.filterSettingService.updateFilterSetting({ memberFiltering: member });
  }

  createCase() {
    this.router.navigate(['create'], {
      relativeTo: this.route
    });
  }

  trackbyStatus(_, item) {
    return item?.key;
  }

  private navigateModule() {
    if (!this.route.firstChild) {
      const params = this.route.snapshot.queryParams;
      const id = +params['id'];
      if (id && typeof id === 'number') {
        this.router.navigate(['cases', params['id']]);
      } else if (params['path']) {
        let pathDecode = decodeURIComponent(params['path']);
        if (pathDecode.includes(';')) {
          pathDecode = pathDecode.split(';')[0];
        }
        if (pathDecode.includes('?')) {
          pathDecode = pathDecode.split('?')[0];
        }
        this.router.navigate([pathDecode]);
      }
    }
  }
}
