import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDrawer } from '@angular/material/sidenav';
import { ActivatedRoute } from '@angular/router';
import {
  IAMMember,
  IAMGrantedPermission,
  IamQuery,
  IamService,
  GetIAMMemberReqParam,
  SortMemberDirection
} from '@b3networks/api/auth';
import { Page, Pageable } from '@b3networks/api/common';
import { DestroySubscriberComponent, FILE_EXPLORER } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import * as _ from 'lodash';
import { combineLatest, debounceTime, Observable, takeUntil } from 'rxjs';
import { PermissionInfo, PermissionsAssignComponent } from './permissions-assign/permissions-assign.component';

@Component({
  selector: 'b3n-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.scss']
})
export class PermissionsComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild('sidenav') sidebar: MatDrawer;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns = ['uuid', 'name'];
  permissions: IAMGrantedPermission[] = [];
  attendantMember: Page<IAMMember>;
  selectedMember: IAMMember;
  members: IAMMember[] = [];
  loading$: Observable<boolean>;
  filterFC = new FormControl();
  pageable = <Pageable>{ page: 0, perPage: 10 };
  reqIAMMember: GetIAMMemberReqParam = {
    sort: SortMemberDirection.ASC,
    keyword: null
  };
  groupUuid: string;
  groupName: string;
  groupNameToolTipFormated: string;
  isFileExplorer: boolean;

  constructor(
    private toastService: ToastService,
    private iamQuery: IamQuery,
    private iamService: IamService,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {
    super();
  }

  ngOnInit(): void {
    this.loading$ = this.iamQuery.selectLoading();
    this.groupUuid = this.route.snapshot.data['groupUuid'];
    this.groupName = this.route.snapshot.data['groupName'];
    this.groupNameToolTipFormated = (this.route.snapshot.data['groupName']?.split('_')?.join(' ') + "'s")?.replace(
      /^(.)|\s+(.)/g,
      c => c.toUpperCase()
    );
    this.isFileExplorer = this.groupName === FILE_EXPLORER;
    combineLatest([
      this.iamService.getMembersByGroupUuid(this.groupUuid, this.reqIAMMember, this.pageable),
      this.iamQuery.actions$
    ])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(data => {
        [this.attendantMember, this.permissions] = data;
        this.updateDisplayedColumns();
      });

    this.searchFilter();
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  trackBy(index: number): number {
    return index;
  }

  showDetail(user: IAMMember, event: Event) {
    event.stopPropagation();
    this.selectedMember = user;
  }

  onPageChanged(pageEvent: PageEvent) {
    this.pageable.page = pageEvent.pageIndex;
    this.onReload();
  }

  searchFilter() {
    this.filterFC.valueChanges.pipe(debounceTime(300)).subscribe(value => {
      this.pageable.page = 0;
      this.reqIAMMember.keyword = value;
      this.onReload();
    });
  }

  onReload() {
    this.iamService
      .getMembersByGroupUuid(this.groupUuid, this.reqIAMMember, this.pageable)
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(data => {
        this.selectedMember = data.content?.find(m => m.identityUuid === this.selectedMember?.identityUuid);
        this.attendantMember = data;
      });
  }

  onAssignPermissions() {
    this.dialog
      .open(PermissionsAssignComponent, {
        minWidth: '450px',
        data: { groupUuid: this.groupUuid, groupName: this.groupName } as PermissionInfo
      })
      .afterClosed()
      .subscribe(status => {
        if (status?.ok) {
          this.onReload();
        }
      });
  }

  hasPermission(member: IAMMember, permission: IAMGrantedPermission): boolean {
    return !!member?.iamPolicy?.policies?.find(p => p.action === permission.action) || member.isUpperAdmin;
  }

  private updateDisplayedColumns() {
    this.permissions?.forEach(p => {
      if (!this.displayedColumns.includes(p.action)) {
        this.displayedColumns.push(p.action);
      }
    });

    // Check if actions column is existing, move to last position
    if (this.displayedColumns.some(col => col === 'actions')) {
      this.displayedColumns.push(this.displayedColumns.splice(this.displayedColumns.indexOf('actions'), 1)[0]);
    } else {
      this.displayedColumns.push('actions');
    }
  }
}
