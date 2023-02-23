import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import {
  IdentityProfileQuery,
  Member,
  MemberStatus,
  ProfileOrg,
  Team,
  TeamQuery,
  TeamService
} from '@b3networks/api/auth';
import { ExtensionBase } from '@b3networks/api/bizphone';
import { ExtensionQuery, ExtensionService } from '@b3networks/api/callcenter';
import {
  DirectoryMember,
  DirectoryMemberQuery,
  DirectoryMemberService,
  GetDirectoryMembersReq
} from '@b3networks/api/directory';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { combineLatest, Observable } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  map,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap
} from 'rxjs/operators';

@Component({
  selector: 'b3n-admin-tools-members',
  templateUrl: './admin-tools-members.component.html',
  styleUrls: ['./admin-tools-members.component.scss']
})
export class AdminToolsMembersComponent extends DestroySubscriberComponent implements OnInit {
  @Output() toggleNoMember = new EventEmitter<boolean>();

  filterFG: UntypedFormGroup;

  me$: Observable<ExtensionBase>;
  me: ExtensionBase;

  isManagedWholeOrg$: Observable<boolean>;
  managedTeams$: Observable<Team[]>;
  members$: Observable<DirectoryMember[]> = this.directoryQuery.selectAll();

  members: Member[];

  get searchKey() {
    const key = this.filterFG.controls['searchExtension'].value;
    return typeof key === 'string' ? key : key.displayName;
  }

  get isMeView() {
    return this.filterFG.controls['teamUuid'].value === 'me';
  }

  constructor(
    private fb: UntypedFormBuilder,
    private profileQuery: IdentityProfileQuery,
    private directoryQuery: DirectoryMemberQuery,
    private directoryService: DirectoryMemberService,
    private teamQuery: TeamQuery,
    private teamService: TeamService,
    private extensionQuery: ExtensionQuery,
    private extensionService: ExtensionService
  ) {
    super();
    this._initControls();
  }

  ngOnInit(): void {
    this.me$ = combineLatest([this.profileQuery.uuid$, this.extensionQuery.allExtensions$]).pipe(
      filter(([uuid, exts]) => !!uuid && exts.length > 0),
      distinctUntilChanged(),
      switchMap(([uuid, _]) => this.extensionQuery.selectExtensionByUser(uuid)),
      distinctUntilKeyChanged('extKey'),
      tap(me => {
        this.me = me;
        const teamUuid = this.filterFG.get('teamUuid').value || '';
        if (me != null && !teamUuid) {
          this.filterFG.get('teamUuid').setValue('me');
        }
      })
    );

    this.profileQuery.currentOrg$
      .pipe(
        filter(org => org != null),
        take(1)
      )
      .subscribe(org => {
        this._handelOrg(org);
      });
  }

  private _handelOrg(org: ProfileOrg) {
    this.teamService.getTeams(X.orgUuid).subscribe();
    const identityUuid = this.profileQuery.identityUuid;
    this.teamService.getTeamsManagedByAdmin(X.orgUuid, identityUuid).subscribe();

    this.isManagedWholeOrg$ = this.teamQuery
      .selectAllManagedByAdmin(identityUuid)
      .pipe(map(managedTeams => org.isOwner || !org.licenseEnabled || !managedTeams.length));

    this.managedTeams$ = combineLatest([
      this.teamQuery.selectAll(),
      this.teamQuery.selectAllManagedByAdmin(identityUuid)
    ]).pipe(
      map(([teams, managedTeams]) => {
        return org.isOwner || !org.licenseEnabled || !managedTeams.length ? teams : managedTeams;
      }),
      tap(teams => {
        const teamUuid = this.filterFG.get('teamUuid').value || '';
        if (!teamUuid && teams.length) {
          this.filterFG.get('teamUuid').setValue(teams[0].uuid);
        }
      })
    );
  }

  private async _getMembers(): Promise<DirectoryMember[]> {
    const req = <GetDirectoryMembersReq>{
      filterExtension: true,
      status: [MemberStatus.active, MemberStatus.pending],
      sort: 'asc'
    };

    const { teamUuid, searchExtension } = this.filterFG.value;
    if (!(searchExtension instanceof DirectoryMember) && !(searchExtension instanceof ExtensionBase)) {
      req.keyword = searchExtension;
    }
    if (!['me', 'everyone'].includes(teamUuid)) {
      req.team = teamUuid;
    }

    return await this.directoryService
      .getMembers(req, { page: 0, perPage: 10 })
      .pipe(map(page => page.content))
      .toPromise();
  }

  private _initControls(): void {
    this.filterFG = this.fb.group({
      teamUuid: [''],
      searchExtension: ['']
    });

    this.filterFG.controls['teamUuid'].valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroySubscriber$))
      .subscribe(async value => {
        switch (value) {
          case 'me':
            this.filterFG.get('searchExtension').setValue(this.me);
            this.filterFG.get('searchExtension').disable();
            break;
          default:
            this.filterFG.get('searchExtension').enable();
            const members = await this._getMembers();

            if (!members.length) {
              this.filterFG.get('searchExtension').setValue(null);
              this.toggleNoMember.emit(true);
            } else {
              this.toggleNoMember.emit(false);
              const searchString = this.filterFG.get('searchExtension').value;

              const extKey = this.isMeView
                ? (searchString as ExtensionBase)?.extKey
                : (searchString as DirectoryMember)?.extensionKey;

              const shouldUpdateMembers = !searchString || members.findIndex(m => m.extensionKey === extKey) === -1;
              if (shouldUpdateMembers) {
                this.filterFG.get('searchExtension').setValue(members[0]);
              }
            }

            break;
        }
      });

    this.filterFG.controls['searchExtension'].valueChanges
      .pipe(distinctUntilChanged(), startWith(''), debounceTime(300), takeUntil(this.destroySubscriber$))
      .subscribe(async (value: string | DirectoryMember | ExtensionBase) => {
        if (value instanceof DirectoryMember) {
          this.extensionService.setActive(value.extensionKey);
        } else if (value instanceof ExtensionBase) {
          this.extensionService.setActive(value.extKey);
        } else if (value == null) {
          if (this.extensionQuery.getActiveId()) {
            this.extensionService.removeActive(this.extensionQuery.getActiveId());
          }
        } else {
          this._getMembers();
        }
      });
  }

  displayFn(member: DirectoryMember): string {
    return member ? member.directoryText : '';
  }
}
