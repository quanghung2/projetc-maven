import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import {
  GetMembersReq,
  IAMGroup,
  IamService,
  IAM_GROUP_UUIDS,
  IdentityProfileQuery,
  Member,
  MemberStatus,
  OrgMemberQuery,
  OrgMemberService,
  ORG_MEMBER_PAGINATOR,
  PendingMember,
  ResendActivationEmailReq,
  Team,
  TeamQuery,
  TeamService
} from '@b3networks/api/auth';
import { ExtensionBase } from '@b3networks/api/bizphone';
import { ExtensionQuery, ExtensionService } from '@b3networks/api/callcenter';
import { Page, Pageable } from '@b3networks/api/common';
import { FeatureService, LicenseFeatureCode, LicenseStatService } from '@b3networks/api/license';
import { MemberRole, Status } from '@b3networks/api/member';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap, PaginatorPlugin } from '@datorama/akita';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, distinctUntilKeyChanged, filter, takeUntil } from 'rxjs/operators';
import { MemberDetailComponent } from '../member-detail/member-detail.component';

export interface IAMGroupUI extends IAMGroup {
  order: number;
  isPermission: boolean;
}

const IAM_NAME_GROUPS = [
  { name: 'People', license: '', uuid: IAM_GROUP_UUIDS.people, order: 1 },
  { name: 'Organization Settings', license: '', uuid: IAM_GROUP_UUIDS.organizationSetting, order: 2 },
  { name: 'Contacts', license: '', uuid: IAM_GROUP_UUIDS.contact, order: 3 },
  {
    name: 'Phone System',
    license: LicenseFeatureCode.extension,
    uuid: IAM_GROUP_UUIDS.phoneSystem,
    order: 4
  },
  { name: 'Developer', license: LicenseFeatureCode.developer, uuid: IAM_GROUP_UUIDS.developer, order: 5 },
  {
    name: 'Auto Attendant',
    license: LicenseFeatureCode.auto_attendant,
    uuid: IAM_GROUP_UUIDS.autoAttendant,
    order: 6
  },
  { name: 'SIP', license: LicenseFeatureCode.license_sip, uuid: IAM_GROUP_UUIDS.sip, order: 7 },
  { name: 'Business Hub', license: '', uuid: IAM_GROUP_UUIDS.businessHub, order: 8 },
  { name: 'File Explorer', license: '', uuid: IAM_GROUP_UUIDS.fileExplorer, order: 9 },
  { name: 'Dashboard', license: '', uuid: IAM_GROUP_UUIDS.dashboard, order: 10 }
  // TODO: license
  // { name: 'eFax', license: '', uuid: IAM_GROUP_UUIDS.eFax, order: 8 }
];

@Component({
  selector: 'pom-members',
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.scss']
})
export class MembersComponent extends DestroySubscriberComponent implements OnInit {
  readonly Status = Status;
  readonly MemberRole = MemberRole;
  readonly MemberStatus = MemberStatus;

  dataSource: MatTableDataSource<PendingMember>;
  @ViewChild('pendingMembersPaginator') pendingMembersPaginator: MatPaginator;
  @ViewChild(MemberDetailComponent) memberDetailComponent: MemberDetailComponent;

  loading$: Observable<boolean>;
  membersPage: Page<Member>;

  extensionMap: HashMap<ExtensionBase> = {};

  isManagedEveryone: boolean;
  managedTeams: Team[];
  filterFG: UntypedFormGroup;
  groups: IAMGroupUI[] = [];

  pageable = <Pageable>{ page: 0, perPage: 10 };
  displayedColumns = ['uuid', 'displayName', 'role'];
  displayPendingMemberColumns = ['uuid', 'displayName', 'role', 'email', 'expireAt', 'action'];

  pendingMembers: PendingMember[] = [];
  hasPendingMember: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isUpperAdmin: boolean;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    @Inject(ORG_MEMBER_PAGINATOR) public paginatorRef: PaginatorPlugin<Member>,
    private profileQuery: IdentityProfileQuery,
    private orgMemberQuery: OrgMemberQuery,
    private orgMemberService: OrgMemberService,
    private licenseStatService: LicenseStatService,
    private teamQuery: TeamQuery,
    private teamService: TeamService,
    private extensionService: ExtensionService,
    private extensionQuery: ExtensionQuery,
    private toastService: ToastService,
    private fb: UntypedFormBuilder,
    private dialog: MatDialog,
    private iamService: IamService,
    private featureService: FeatureService
  ) {
    super();
    this._initControls();
  }

  get isLicenseOrgAndActiveStatus(): boolean {
    return this.profileQuery.currentOrg?.licenseEnabled && this.filterFG.value.status === MemberStatus.active;
  }

  ngOnInit() {
    this.profileQuery.uuid$
      .pipe(
        filter(uuid => !!uuid),
        distinctUntilChanged()
      )
      .subscribe(uuid => {
        combineLatest([this.teamQuery.selectAll(), this.teamQuery.selectAllManagedByAdmin(uuid)])
          .pipe(takeUntil(this.destroySubscriber$))
          .subscribe(([teams, managedTeams]) => {
            const profileOrg = this.profileQuery.currentOrg;
            this.isOwner = profileOrg.isOwner;
            this.isAdmin = profileOrg.isAdmin;
            this.isUpperAdmin = profileOrg.isUpperAdmin;
            this.isManagedEveryone =
              (profileOrg.isOwner || !profileOrg.licenseEnabled || !managedTeams.length) && teams.length > 0;

            this.managedTeams = this.isManagedEveryone ? teams : managedTeams;

            let teamUuid = this.filterFG.get('teamUuid').value || '';
            if (!this.isManagedEveryone && this.managedTeams.length && !this.filterFG.get('teamUuid').value) {
              teamUuid = this.managedTeams[0].uuid;
            }
            if (this.filterFG.get('teamUuid').value !== teamUuid) {
              this.filterFG.get('teamUuid').setValue(teamUuid);
            }
          });

        this.teamService.getTeamsManagedByAdmin(X.orgUuid, uuid).subscribe();
      });

    if (this.teamQuery.hasntLoaded(X.orgUuid)) {
      this.teamService.getTeams(X.orgUuid).subscribe();
    }

    this.profileQuery.currentOrg$
      .pipe(
        filter(org => org != null),
        distinctUntilKeyChanged('licenseEnabled'),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(currentOrg => {
        if (currentOrg.licenseEnabled) {
          this.displayedColumns = ['uuid', 'ext', 'displayName', 'role', 'email', 'action'];

          this.licenseStatService.getLicenseStatistics({ useCache: true }).subscribe();
          this.extensionService.getAllExtenison().subscribe();
          this.extensionQuery.allAssignedExtensions$.pipe(filter(exts => !!exts?.length)).subscribe(exts => {
            exts.forEach(ext => {
              this.extensionMap[ext.identityUuid] = ext;
            });
          });

          if (currentOrg.isUpperAdmin) {
            combineLatest([this.featureService.get(), this.iamService.fetchGroups()]).subscribe(([feature, groups]) => {
              this.groups = [];
              groups.forEach(group => {
                const license = IAM_NAME_GROUPS.find(g => g.uuid === group.uuid);
                if (license?.uuid === IAM_GROUP_UUIDS.businessHub) {
                  if (currentOrg.isPartner) {
                    this.groups.push(<IAMGroupUI>{
                      ...group,
                      order: license.order
                    });
                  }
                } else {
                  if (license && (!license.license || feature.includes(license.license))) {
                    this.groups.push(<IAMGroupUI>{
                      ...group,
                      order: license.order
                    });
                  }
                }
              });
              this.groups = this.groups.sort((a, b) => a.order - b.order);
            });
          }
        } else {
          this.displayedColumns = ['uuid', 'displayName', 'role', 'email', 'mobileNumber', 'action'];
        }
      });

    this.checkPendingMembers();
  }

  closeDrawer() {
    this.orgMemberService.removeActive(this.orgMemberQuery.getActiveId());
    if (this.memberDetailComponent) {
      this.memberDetailComponent.selectIndexTab = 0;
    }
  }

  findExtByIdentity(exts: ExtensionBase[], uuid: string) {
    return exts.find(ext => ext.identityUuid === uuid);
  }

  showDetail(member: Member, event: Event) {
    event.stopPropagation();
    this.orgMemberService.activeMember(member);
  }

  refreshMembersPage(_: boolean) {
    this.isLicenseOrgAndActiveStatus ? this._getDirectoryMembers() : this._getMembers();
  }

  pageChanged(pageEvent: PageEvent) {
    this.pageable.page = pageEvent.pageIndex;
    this.isLicenseOrgAndActiveStatus ? this._getDirectoryMembers() : this._getMembers();
  }

  copy(event) {
    event.stopPropagation();
    this.toastService.success('Copied to clipboard');
  }

  changeStatus() {
    this.filterFG.patchValue({ status: Status.PENDING });
  }

  private _getMembers() {
    this.loading$ = this.orgMemberQuery.selectLoading();
    const filter = this.filterFG.value;
    const req = <GetMembersReq>{
      orgUuid: X.orgUuid,
      filterByTeamUuid: filter.status === MemberStatus.active ? filter.teamUuid : null,
      ...filter,
      sort: filter.status !== MemberStatus.active ? 'identity.displayName' : filter.sort
    };

    this.orgMemberService.getMembers(req, this.pageable).subscribe(
      page => {
        this.membersPage = page;
      },
      error => {
        this.toastService.error(error.message);
      }
    );
  }

  private _getDirectoryMembers() {
    this.orgMemberQuery.selectLoading();
    const filter = this.filterFG.value;
    const { filterByRoles, ...req } = <GetMembersReq>{
      ...filter,
      sort: filter.sort === 'identity.displayName' ? 'i.displayName' : filter.sort,
      roles: filter.filterByRoles
    };
    this.orgMemberService.getDirectoryMembers(req, this.pageable).subscribe(
      page => {
        this.membersPage = page;
      },
      error => {
        this.toastService.error(error.message);
      }
    );
  }

  private _initControls() {
    this.filterFG = this.fb.group({
      teamUuid: [null],
      status: [Status.ACTIVE],
      keyword: [null],
      sort: ['identity.displayName'],
      filterByRoles: []
    });

    this.filterFG.valueChanges.pipe(debounceTime(200)).subscribe(value => {
      this.pageable.page = 0;
      value.status === Status.PENDING
        ? this._showPendingMembers()
        : this.isLicenseOrgAndActiveStatus
        ? this._getDirectoryMembers()
        : this._getMembers();
    });
  }

  private checkPendingMembers() {
    const filter = this.filterFG.value;
    const req = <GetMembersReq>{
      ...filter
    };
    this.orgMemberService
      .getPendingMembers(req)
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(members => {
        this.pendingMembers = members;
        this.hasPendingMember = this.orgMemberQuery.getValue()?.hasPendingMember;
      });
  }

  private _showPendingMembers() {
    this.loading$ = this.orgMemberQuery.selectLoading();
    const filter = this.filterFG.value;
    const req = <GetMembersReq>{
      ...filter
    };
    this.orgMemberService.getPendingMembers(req).subscribe(members => {
      this.pendingMembers = members;
      this.dataSource = new MatTableDataSource<PendingMember>(this.pendingMembers);
      setTimeout(() => {
        this.dataSource.paginator = this.pendingMembersPaginator;
      });
    });
  }

  delete(member: Member, event) {
    event.stopPropagation();

    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        autoFocus: false,
        data: <ConfirmDialogInput>{
          title: 'Delete member',
          message: `Are you sure to delete <strong>${member.displayName}</strong>?`,
          confirmLabel: 'Delete',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.orgMemberService.deleteMember(X.orgUuid, member.memberUuid).subscribe(
            _ => {
              this.toastService.success('Deleted successfully');
              this.refreshMembersPage(true);
            },
            error => {
              this.toastService.error(error.message || 'Cannot delete this member. Please try again in a few minutes ');
            }
          );
        }
      });
  }

  deletePending(m: PendingMember, event) {
    event.stopPropagation();

    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        autoFocus: false,
        data: <ConfirmDialogInput>{
          title: 'Delete member',
          message: `Are you sure to delete <strong>${m.member.displayName}</strong>?`,
          confirmLabel: 'Delete',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.orgMemberService.deletePendingMembers(m.id).subscribe(
            _ => {
              this.toastService.success('Deleted successfully');
              this._showPendingMembers();
            },
            error => {
              this.toastService.error(error.message || 'Cannot delete this member. Please try again in a few minutes ');
            }
          );
        }
      });
  }

  confirmAndSendActivation(member: PendingMember) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        autoFocus: false,
        data: <ConfirmDialogInput>{
          title: 'Send activation email',
          message: 'Do you want to send activation email?',
          confirmLabel: 'Send'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          const memberUuids = [member.member.uuid];
          const req = { memberUuids: memberUuids } as ResendActivationEmailReq;
          this.orgMemberService.resendActivationEmails(req).subscribe(
            _ => {
              this.toastService.success('Sent request. Please check your email in a few minutes');
            },
            error => {
              this.toastService.error('An error occurred. Please try again in a few minutes');
            }
          );
        }
      });
  }

  onAddNewMember(added: boolean) {
    if (added) {
      this.checkPendingMembers();
      this._showPendingMembers();
    }
  }
}
