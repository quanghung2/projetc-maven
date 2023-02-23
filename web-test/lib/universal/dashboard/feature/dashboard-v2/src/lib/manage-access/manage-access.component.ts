import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { IdentityProfile, IdentityProfileQuery } from '@b3networks/api/auth';
import { ExtensionService } from '@b3networks/api/callcenter';
import { Dashboard2, DashboardV2Service, Management, MANAGEMENT_TYPE } from '@b3networks/api/dashboard';
import { DEFAULT_WARNING_MESSAGE } from '@b3networks/portal/setting';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest, firstValueFrom, forkJoin } from 'rxjs';
import { debounceTime, filter, finalize, startWith, takeUntil, tap } from 'rxjs/operators';
import { StoreAccessComponent } from './store-access/store-access.component';

export type ManageAccessForm = FormGroup<{
  search: FormControl<string>;
  accessAll: FormControl<boolean>;
  type: FormControl<number>;
}>;

@Component({
  selector: 'b3n-manage-access',
  templateUrl: './manage-access.component.html',
  styleUrls: ['./manage-access.component.scss']
})
export class ManageAccessComponent extends DestroySubscriberComponent implements OnInit {
  displayedColumns: string[] = ['extLabel', 'dashboardUuids', 'actions'];
  loading: boolean;
  form: ManageAccessForm;
  managements: Management[] = [];
  extManagements: Management[] = [];
  extManagementsFilter: Management[] = [];
  dataSource: MatTableDataSource<Management>;
  onInit: boolean = true;
  dashboard2s: Dashboard2[] = [];
  profile: IdentityProfile;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  readonly MANAGEMENT_TYPE = MANAGEMENT_TYPE;

  constructor(
    private extensionService: ExtensionService,
    private fb: FormBuilder,
    private dashboardV2Service: DashboardV2Service,
    private toastService: ToastService,
    public dialog: MatDialog,
    private profileQuery: IdentityProfileQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.profileQuery.profile$
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(profile => {
          this.profile = profile;
        })
      )
      .subscribe();

    this.initForm();
    this.initData();
  }

  initData() {
    this.loading = true;

    forkJoin([
      this.dashboardV2Service.getManagements(),
      this.extensionService.getAllExtenison(false),
      this.dashboardV2Service.getAllDashboards()
    ])
      .pipe(
        finalize(() => (this.loading = false)),
        tap(async ([managements, extensions, dashboard2s]) => {
          this.managements = managements;
          this.dashboard2s = dashboard2s;

          if (this.managements && this.managements.length && this.onInit) {
            const orgManagement = this.managements.find(m => m.identityUuid === '*');
            this.accessAll.setValue(orgManagement ? orgManagement.allUserAccessAll : false);
          }

          this.onInit = false;

          this.extManagements = extensions
            .reduce<Management[]>((prev, curr) => {
              if (!curr.identityUuid || curr.identityUuid === this.profile.uuid) {
                return prev;
              }

              prev.push(
                new Management({
                  extLabel: curr.extLabel,
                  identityUuid: curr.identityUuid
                })
              );

              return prev;
            }, [])
            .sort((a, b) => a.extLabel?.localeCompare(b.extLabel));

          if (this.accessAll.value) {
            this.type.setValue(this.MANAGEMENT_TYPE[0].key);
            this.type.disable();
          } else {
            this.type.setValue(this.MANAGEMENT_TYPE[1].key);
          }
        })
      )
      .subscribe();
  }

  initForm() {
    this.form = this.fb.group({
      search: [''],
      accessAll: [false],
      type: [this.MANAGEMENT_TYPE[0].key]
    });

    combineLatest([
      this.search.valueChanges.pipe(startWith('')),
      this.type.valueChanges.pipe(startWith(this.MANAGEMENT_TYPE[0].key))
    ])
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(() => !this.onInit),
        debounceTime(200),
        tap(([search, type]) => {
          const keyword = search.trim().toLowerCase();

          this.extManagementsFilter = this.extManagements.filter(extManagement => {
            const searchCondition = () => extManagement.extLabel?.toLowerCase().trim().includes(keyword);
            let typeFilterCondition: () => void;

            switch (type) {
              case MANAGEMENT_TYPE[0].key:
                typeFilterCondition = null;
                break;

              case MANAGEMENT_TYPE[1].key:
                typeFilterCondition = () => {
                  const uuids = this.managements.map(m => m.identityUuid);
                  return uuids.includes(extManagement.identityUuid);
                };
                break;

              default:
                break;
            }

            return typeFilterCondition ? searchCondition() && typeFilterCondition() : searchCondition();
          });

          this.dataSource = new MatTableDataSource(this.extManagementsFilter);
          this.dataSource.paginator = this.paginator;

          setTimeout(() => {
            this.handleCurrentPageData();
          }, 0);
        })
      )
      .subscribe();

    this.accessAll.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(() => !this.onInit),
        tap(async accessAll => {
          try {
            await firstValueFrom(this.dashboardV2Service.changeManagement(accessAll));

            if (accessAll) {
              this.type.setValue(this.MANAGEMENT_TYPE[0].key);
              this.type.disable();
            } else {
              this.type.enable();
            }

            this.toastService.success(`Update successfully`);
          } catch (e) {
            this.toastService.error(this.extManagements['message'] || DEFAULT_WARNING_MESSAGE);
          }
        })
      )
      .subscribe();
  }

  async handleCurrentPageData(fetchData: boolean = false) {
    if (fetchData) {
      this.managements = await firstValueFrom(this.dashboardV2Service.getManagements());
      this.type.setValue(this.type.value);
      return;
    }

    if (!this.paginator) {
      return;
    }

    const skip = this.paginator.pageSize * this.paginator.pageIndex;
    this.dataSource.data
      .filter((_, i) => i >= skip)
      .filter((_, i) => i < this.paginator.pageSize)
      .map(async (extManagement, _) => {
        extManagement.dashboardUuids = null;
        let management: Management;

        if (this.type.value === this.MANAGEMENT_TYPE[1].key) {
          management = this.managements.find(m => m.identityUuid === extManagement.identityUuid);
        } else {
          management = await firstValueFrom(this.dashboardV2Service.getExtManagement(extManagement.identityUuid));
        }

        extManagement.dashboardUuids = management.dashboardUuids;
      });
  }

  page(_: PageEvent) {
    this.handleCurrentPageData();
  }

  storeAccess(management: Management) {
    this.dialog
      .open(StoreAccessComponent, {
        width: '550px',
        height: '440px',
        panelClass: 'store-access__dashboard2',
        data: {
          management,
          dashboard2s: this.dashboard2s
        },
        disableClose: true
      })
      .afterClosed()
      .pipe(
        filter(res => !!res),
        tap(_ => {
          this.handleCurrentPageData(true);
        })
      )
      .subscribe();
  }

  get search() {
    return this.form.controls['search'];
  }

  get accessAll() {
    return this.form.controls['accessAll'];
  }

  get type() {
    return this.form.controls['type'];
  }
}
