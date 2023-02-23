import { Component, OnInit, ViewChild } from '@angular/core';
import {
  GetIAMMemberReqParam,
  IAM_GROUP_UUIDS,
  IAMGrantedPermission,
  IAMMember,
  IamQuery,
  IamService,
  Member,
  SortMemberDirection
} from '@b3networks/api/auth';
import { combineLatest, Observable } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { ToastService } from '@b3networks/shared/ui/toast';
import { MatDrawer } from '@angular/material/sidenav';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { debounceTime, filter, takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { AddPermissionDialogComponent } from './add-permission-dialog/add-permission-dialog.component';
import { PageEvent } from '@angular/material/paginator';
import { Page, Pageable } from '@b3networks/api/common';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'b3n-permission',
  templateUrl: './permission.component.html',
  styleUrls: ['./permission.component.scss']
})
export class PermissionComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild('sidenav') sidebar: MatDrawer;

  loading$: Observable<boolean>;
  displayedColumns = ['uuid', 'name'];
  dataSource: MatTableDataSource<IAMMember>;
  members: IAMMember[] = [];
  selectedMember: IAMMember;
  businessHubPermissions: IAMGrantedPermission[] = [];
  memberPage: Page<IAMMember>;
  filterCtrl = new FormControl();
  memberMapping = {};
  pageable: Pageable = {
    page: 0,
    perPage: 10
  };
  req: GetIAMMemberReqParam = {
    sort: SortMemberDirection.ASC,
    keyword: ''
  };

  constructor(
    private iamService: IamService,
    private toastService: ToastService,
    private iamQuery: IamQuery,
    private dialog: MatDialog
  ) {
    super();
  }

  ngOnInit(): void {
    this.loading$ = this.iamQuery.selectLoading();

    combineLatest([
      this.iamService.getMembersByGroupUuid(IAM_GROUP_UUIDS.businessHub, this.req, this.pageable),
      this.iamQuery.actions$.pipe(filter(p => !!p))
    ])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([page, permissions]) => {
        this.businessHubPermissions = permissions;
        this.memberPage = page;
        this.updateDisplayedColumns();
        this.updateDataSource();
      });
    this.listenMemberFilter();
  }

  listenMemberFilter() {
    this.filterCtrl.valueChanges.pipe(debounceTime(350), takeUntil(this.destroySubscriber$)).subscribe(value => {
      this.req.keyword = value;
      this.pageable.page = 0;
      this.reload();
    });
  }

  copy(event) {
    event.stopPropagation();
    this.toastService.success('Copied to clipboard');
  }

  showDetail(user: Member, event) {
    event.stopPropagation();
    this.selectedMember = user;
    this.sidebar.open();
  }

  reload() {
    const businessHubUuid = IAM_GROUP_UUIDS.businessHub;
    this.iamService
      .getMembersByGroupUuid(businessHubUuid, this.req, this.pageable)
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(page => {
        this.memberPage = page;
        this.updateDataSource();
      });
  }

  openAddDialog() {
    this.dialog
      .open(AddPermissionDialogComponent, {
        minWidth: '450px'
      })
      .afterClosed()
      .subscribe(status => {
        if (status?.ok) {
          this.reload();
        }
      });
  }

  trackBy(index: number) {
    return index;
  }

  onPageChange(event: PageEvent) {
    this.pageable.page = event.pageIndex;
    this.reload();
  }

  private updateDisplayedColumns() {
    this.businessHubPermissions?.forEach(p => {
      if (!this.displayedColumns.includes(p.action)) {
        this.displayedColumns.push(p.action);
      }
    });
    this.displayedColumns.push('actions');
  }

  private updateDataSource() {
    this.memberMapping = this.memberPage.content?.reduce((map, member) => {
      const memberActions = member.iamPolicy?.policies?.map(p => p.action);

      map[member.identityUuid] = this.businessHubPermissions?.reduce((acc, permission) => {
        acc[permission.action] = memberActions?.includes(permission.action) || member.isUpperAdmin;
        return acc;
      }, {});
      return map;
    }, {});

    this.dataSource = new MatTableDataSource<IAMMember>(this.memberPage.content);
  }
}
