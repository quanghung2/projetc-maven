import { KeyValue } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import {
  Hyperspace,
  HyperspaceQuery,
  HyperspaceService,
  MeQuery,
  ReqHyperspaceManagement,
  UserHyperspace
} from '@b3networks/api/workspace';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import {
  AddUserHyperspaceModalComponent,
  AddUserHyperspaceModalInput
} from '../add-user-hyperspace-modal/add-user-hyperspace-modal.component';

const DEFAULT_OPTION = 'ALL';

@Component({
  selector: 'b3n-hyperspace-management-detail',
  templateUrl: './hyperspace-management-detail.component.html',
  styleUrls: ['./hyperspace-management-detail.component.scss']
})
export class HyperspaceManagementDetailComponent extends DestroySubscriberComponent implements OnChanges {
  @Input() hyper: Hyperspace;

  @Output() closeSidenavEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

  dataSource: MatTableDataSource<UserHyperspace> = new MatTableDataSource<UserHyperspace>();
  displayedColumns = ['name', 'orgName', 'actions'];
  isLoading: boolean;
  usersOrigin: UserHyperspace[] = [];
  meUuid: string;
  orgOpt: KeyValue<string, string>[] = [];

  group = this.fb.group({
    searchMember: '',
    orgUuid: DEFAULT_OPTION
  });

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  private _hyperId: string;

  constructor(
    private fb: UntypedFormBuilder,
    private meQuery: MeQuery,
    private dialog: MatDialog,
    private toastService: ToastService,
    private hyperspaceQuery: HyperspaceQuery,
    private hyperspaceService: HyperspaceService
  ) {
    super();
    this.meUuid = this.meQuery.getMe().userUuid;
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hyper'] && this._hyperId !== this.hyper.id) {
      this.orgOpt = [
        { key: DEFAULT_OPTION, value: 'All' },
        {
          key: this.hyper?.currentOrg?.uuid,
          value: this.hyper?.currentOrg?.shortName
        },
        {
          key: this.hyper?.otherOrg?.uuid,
          value: this.hyper?.otherOrg?.shortName
        }
      ];

      this.hyperspaceQuery
        .selectPropertyHyperspace(this.hyper.id, 'allMembers')
        .pipe(
          takeUntil(this.destroySubscriber$),
          map(users => users.sort((a, b) => a?.displayName?.localeCompare(b?.displayName)))
        )
        .subscribe(users => {
          this.usersOrigin = [...users];
          this.updateDataSource(users);
        });

      this.group.valueChanges.pipe(takeUntil(this.destroySubscriber$), debounceTime(300)).subscribe(value => {
        const contactsOrigin = [...this.usersOrigin];
        if (value?.searchMember?.trim().length) {
          const data = contactsOrigin.filter(
            item =>
              item.displayName?.toLowerCase().includes(value?.searchMember.toLowerCase()) &&
              (value?.orgUuid === DEFAULT_OPTION || value?.orgUuid === item.orgUuid)
          );

          this.updateDataSource(data);
          return;
        }

        const filter = [...this.usersOrigin].filter(
          item => value?.orgUuid === DEFAULT_OPTION || value?.orgUuid === item.orgUuid
        );
        this.updateDataSource(filter);
      });
    }
  }

  closeSidenav() {
    this.closeSidenavEvent.emit();
  }

  addContact() {
    this.dialog.open(AddUserHyperspaceModalComponent, {
      width: '500px',
      disableClose: true,
      data: <AddUserHyperspaceModalInput>{
        hyperId: this.hyper.id,
        users: this.usersOrigin.filter(x => x.orgUuid === X.orgUuid).map(x => x.userUuid)
      }
    });
  }

  confirmDeleteMember(user: UserHyperspace) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Remove contact',
          message: `Are you sure you want to remove this usser out of hyerspace?`,
          cancelLabel: 'Cancel',
          confirmLabel: 'Confirm',
          color: 'warn'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.deleteContact(user);
        }
      });
  }

  private deleteContact(user: UserHyperspace) {
    this.hyperspaceService
      .addOrRemoveMemberToHyperspace(
        this.hyper.id,
        <ReqHyperspaceManagement>{
          remove: [user.userUuid]
        },
        X.orgUuid
      )
      .subscribe(
        () => {
          this.usersOrigin = this.usersOrigin.filter(x => x.userUuid !== user.userUuid);
          this.updateDataSource(this.usersOrigin);
          this.toastService.success('Remove member successfully!');
        },
        error => {
          this.toastService.error(error?.message || 'Remove member failed!');
        }
      );
  }

  private updateDataSource(data: UserHyperspace[]) {
    this.dataSource = new MatTableDataSource<UserHyperspace>(data);
    this.dataSource.paginator = this.paginator;
  }
}
