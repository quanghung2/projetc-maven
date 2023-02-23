import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatDrawer } from '@angular/material/sidenav';
import { MatTableDataSource } from '@angular/material/table';
import {
  IAMGrantedPermission,
  IAMMember,
  IamService,
  IAM_GROUP_UUIDS,
  MemberRole,
  SortMemberDirection
} from '@b3networks/api/auth';
import { Dashboard2, DashboardPermission, DashboardV2Service, IAM_DASHBOARD_SERVICE } from '@b3networks/api/dashboard';
import { DEFAULT_WARNING_MESSAGE } from '@b3networks/portal/setting';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { firstValueFrom, Observable, takeUntil } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';

type PermissionManagementForm = FormGroup<{
  search: FormControl<string>;
}>;

@Component({
  selector: 'b3n-permission-management',
  templateUrl: './permission-management.component.html',
  styleUrls: ['./permission-management.component.scss']
})
export class PermissionManagementComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild('drawer') drawer: MatDrawer;

  form: PermissionManagementForm;
  dataSource: MatTableDataSource<IAMMember>;
  iamMembers: IAMMember[] = [];
  iamMember: IAMMember;
  displayedColumns = ['uuid', 'name', 'actions'];
  dashboards: Dashboard2[] = [];
  rowMinWidth: number = 120 + 300; //! uuid + name, re-calculate scss file when having change
  statusMap = {};
  totalCount = 0;
  showDrawer = false; // make drawer lazy load
  loading = true;
  keyword = '';

  readonly MemberRole = MemberRole;
  readonly DashboardPermission = DashboardPermission;
  readonly PerPage = 10;

  constructor(
    private iamService: IamService,
    private dashboardV2Service: DashboardV2Service,
    private fb: FormBuilder,
    private toastService: ToastService,
    private clipboard: Clipboard
  ) {
    super();
  }

  async ngOnInit() {
    this.form = this.fb.group({
      search: [null]
    });

    this.handleSearch();
    this.dashboards = await firstValueFrom(this.dashboardV2Service.getDashboards());
    this.rowMinWidth += 200 * this.dashboards.length;
    this.displayedColumns.splice(2, 0, ...this.dashboards.map(d => d.uuid));

    await this.loadData(0);
  }

  async loadData(page: number) {
    this.loading = true;

    try {
      const res = await firstValueFrom(
        this.iamService.getMembersByGroupUuid(
          IAM_GROUP_UUIDS.dashboard,
          { sort: SortMemberDirection.ASC, keyword: this.keyword },
          {
            page: page,
            perPage: this.PerPage
          }
        )
      );

      this.totalCount = res.totalCount;
      this.iamMembers = res.content;
      let reload = false;

      for (let i = 0; i < this.iamMembers.length; i++) {
        const member = this.iamMembers[i];

        if (member.role === MemberRole.ADMIN) {
          continue;
        }

        const policies = member.iamPolicy.policies;
        const readonlyPermission: IAMGrantedPermission = policies.find(p => p.action === DashboardPermission.READONLY);
        const managePermission: IAMGrantedPermission = policies.find(p => p.action === DashboardPermission.MANAGE);
        const dashboardMap = {};
        let noAccessDashboardCount = 0;

        this.dashboards.forEach(d => {
          dashboardMap[d.uuid] = {};

          if (readonlyPermission?.resources?.length === 1 && readonlyPermission?.resources[0] === '*') {
            dashboardMap[d.uuid][DashboardPermission.READONLY] = true;
          } else {
            dashboardMap[d.uuid][DashboardPermission.READONLY] = !!readonlyPermission?.resources.find(
              r => r === d.uuid
            );
          }

          if (managePermission?.resources?.length === 1 && managePermission?.resources[0] === '*') {
            dashboardMap[d.uuid][DashboardPermission.MANAGE] = true;
          } else {
            dashboardMap[d.uuid][DashboardPermission.MANAGE] = !!managePermission?.resources.find(r => r === d.uuid);
          }

          if (
            !dashboardMap[d.uuid][DashboardPermission.READONLY] &&
            !dashboardMap[d.uuid][DashboardPermission.MANAGE]
          ) {
            noAccessDashboardCount++;
          }
        });

        if (noAccessDashboardCount === this.dashboards.length) {
          await this.removeDeletedDashboard(member.memberUuid, readonlyPermission, managePermission);
          reload = true;
        } else {
          this.statusMap[member.memberUuid] = dashboardMap;
        }
      }

      if (reload) {
        this.loadData(page);
      } else {
        this.dataSource = new MatTableDataSource(this.iamMembers);
      }
    } catch (error) {
      this.toastService.error(error['message'] ?? DEFAULT_WARNING_MESSAGE);
    } finally {
      this.loading = false;
    }
  }

  async removeDeletedDashboard(
    memberUuid: string,
    readonlyPermission: IAMGrantedPermission,
    managePermission: IAMGrantedPermission
  ) {
    const obsArr: Observable<Object>[] = [];

    if (readonlyPermission?.resources?.length) {
      const baseReadonlyPermission: Partial<IAMGrantedPermission> = {
        service: IAM_DASHBOARD_SERVICE,
        action: DashboardPermission.READONLY,
        resources: readonlyPermission.resources
      };

      obsArr.push(this.iamService.removeIAMMember(X.orgUuid, memberUuid, baseReadonlyPermission));
    }

    if (managePermission?.resources?.length) {
      const baseManagePermission: Partial<IAMGrantedPermission> = {
        service: IAM_DASHBOARD_SERVICE,
        action: DashboardPermission.MANAGE,
        resources: managePermission.resources
      };

      obsArr.push(this.iamService.removeIAMMember(X.orgUuid, memberUuid, baseManagePermission));
    }

    for (let i = 0; i < obsArr.length; i++) {
      const obs$ = obsArr[i];
      await firstValueFrom(obs$);
    }
  }

  refresh() {
    this.totalCount = 0;
    this.form.controls['search'].setValue('');
  }

  handleSearch() {
    this.form.controls['search'].valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        debounceTime(300),
        tap(value => {
          this.keyword = value.trim().toLowerCase();
          this.loadData(0);
        })
      )
      .subscribe();
  }

  openDrawer() {
    this.showDrawer = true;
    this.drawer.autoFocus = false;
    this.drawer.disableClose = true;
    this.drawer.open();
  }

  closeDrawer(refresh: boolean) {
    this.iamMember = null;
    this.drawer.close();

    if (refresh) {
      this.refresh();
    }
  }

  handlePage(page: PageEvent) {
    this.loadData(page.pageIndex);
  }

  edit(member: IAMMember) {
    this.iamMember = member;
    this.openDrawer();
  }

  copy(uuid: string) {
    const res = this.clipboard.copy(uuid);

    if (res) {
      this.toastService.success('Copied to clipboard');
    } else {
      this.toastService.warning('Something went wrong');
    }
  }
}
