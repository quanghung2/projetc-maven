import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IAM_SERVICES,
  IAM_UI_ACTIONS,
  IAM_UI_RESOURCES,
  IdentityProfileQuery,
  MemberStatus,
  OrganizationPolicyQuery,
  ProfileOrg,
  Team,
  TeamQuery,
  TeamService
} from '@b3networks/api/auth';
import { Extension, ExtensionBase } from '@b3networks/api/bizphone';
import { ExtensionQuery, ExtensionService as CCExtensionService } from '@b3networks/api/callcenter';
import {
  DirectoryMember,
  DirectoryMemberQuery,
  DirectoryMemberService,
  GetDirectoryMembersReq
} from '@b3networks/api/directory';
import { FeatureQuery, GetLicenseReq, LicenseFeatureCode, LicenseService, MeQuery } from '@b3networks/api/license';
import { ADMIN_LINK, AppStateService, APP_LINK, USER_LINK } from '@b3networks/portal/setting';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { combineLatest, forkJoin, Observable, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  map,
  share,
  startWith,
  take,
  takeUntil,
  tap
} from 'rxjs/operators';

interface SidebarData {
  me: Extension;
  profileOrg: ProfileOrg;
}

@Component({
  selector: 'b3n-sidebar-settings',
  templateUrl: './sidebar-settings.component.html',
  styleUrls: ['./sidebar-settings.component.scss']
})
export class SidebarSettingsComponent extends DestroySubscriberComponent implements OnInit {
  menus: MenuItem[] = [];

  filterFG: UntypedFormGroup;

  data$: Observable<SidebarData>;
  me: Extension;

  orgHasPhoneSystem$ = this.orgFeatureQuery.hasPhoneSystemBaseLicense$.pipe(
    distinctUntilChanged(),
    share(),
    tap(x => console.log(`has phone system ${x}`))
  );

  isManagedWholeOrg$: Observable<boolean>;
  managedTeams$: Observable<Team[]>;
  members$: Observable<DirectoryMember[]> = this.directoryQuery.selectAll();

  isAgentView = true;

  get isMeView() {
    return this.filterFG.controls['teamUuid'].value === 'me';
  }

  get isSystem() {
    return this.filterFG.controls['teamUuid'].value === 'system';
  }

  get searchKey() {
    const key = this.filterFG.controls['searchMember'].value;
    return typeof key === 'string' ? key : key?.directoryText;
  }

  constructor(
    private router: Router,
    private fb: UntypedFormBuilder,
    private appStateService: AppStateService,
    private profileQuery: IdentityProfileQuery,
    private extensionQuery: ExtensionQuery,
    private extensionService: CCExtensionService,
    private directoryQuery: DirectoryMemberQuery,
    private directoryService: DirectoryMemberService,
    private teamQuery: TeamQuery,
    private teamService: TeamService,
    private licenseService: LicenseService,
    private meFeatureQuery: MeQuery,
    private orgFeatureQuery: FeatureQuery,
    private orgPolicyQuery: OrganizationPolicyQuery
  ) {
    super();
    this._initControls();
  }

  ngOnInit() {
    this.data$ = combineLatest([
      this.profileQuery.currentOrg$.pipe(
        filter(org => org != null),
        distinctUntilKeyChanged('orgUuid'),
        tap(org => {
          this._handelOrg(org);
        })
      ),
      this.extensionService.getMe().pipe(catchError(_ => of(null)))
    ]).pipe(
      map(
        ([currentOrg, ext]) =>
          <SidebarData>{
            me: ext,
            profileOrg: currentOrg
          }
      ),
      tap(data => console.log(data)),
      tap(data => {
        this.me = data.me;
        const teamUuid = this.filterFG.get('teamUuid').value || '';

        if (!data.me && data.profileOrg.isUpperAdmin) {
          if (!teamUuid || teamUuid === 'me') {
            this.filterFG.get('teamUuid').setValue('system');
          }
        } else if (data.me != null) {
          this.filterFG.get('teamUuid').setValue('me');
        }
      })
    );

    this._handleCRMenuVisibility();
  }

  memberDisplayFn(member: DirectoryMember): string {
    return member ? member.directoryText : '';
  }

  private _handelOrg(org: ProfileOrg) {
    this._updateMenuItems(org);
    this._getTeams(org);
  }

  private _handleCRMenuVisibility() {
    this.extensionQuery
      .selectActive()
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(ext => ext != null),
        distinctUntilKeyChanged('extKey'),
        tap((extension: ExtensionBase) => {
          if (extension) {
            forkJoin([
              this.extensionService.getDetails(extension.extKey),
              this.licenseService.getLicenses(<GetLicenseReq>{ resourceKey: extension.extKey }).pipe(
                map(page => {
                  const licenses = page.content;
                  let featureCodes: string[] = [];
                  if (licenses.length) {
                    featureCodes.push(...licenses[0].featureCodes);
                    featureCodes.push(
                      ...licenses[0].mappings.map(m => m.featureCodes).reduce((a, b) => a.concat(b), [])
                    );
                  }

                  featureCodes = [...new Set(featureCodes)];
                  this.appStateService.udpateAppState({ assignedFeatureCodes: featureCodes });
                  return featureCodes;
                })
              )
            ]).subscribe(([extDetail, featureCodes]) => {
              // handle CallRecording menu
              const isConfigurable = extDetail.crConfig.isConfigurable;
              const hasCrLicense =
                featureCodes.includes(LicenseFeatureCode.cr) || featureCodes.includes(LicenseFeatureCode.cr_unlimited);
              const isUpperAdmin = this.profileQuery.currentOrg.isUpperAdmin;
              const canViewCallRecordingMenu = hasCrLicense && (isUpperAdmin || isConfigurable);

              const crUrlPath = APP_LINK.user + '/' + USER_LINK.callRecordings;
              const index = this.menus.findIndex(o => o.urlPath === crUrlPath);
              if (canViewCallRecordingMenu) {
                if (index === -1) {
                  this.menus.push({
                    urlPath: APP_LINK.user + '/' + USER_LINK.callRecordings,
                    displayText: 'Call Recordings',
                    isAgentView: true
                  });
                }
                this.menus.sort(this._sortMenuFunc);
              } else {
                if (index > -1) {
                  this.menus.splice(index, 1);
                }
              }
            });
          }
        })
      )
      .subscribe();
  }

  private _getTeams(org: ProfileOrg) {
    if (org.isUpperAdmin) {
      this.orgFeatureQuery.selectAllFeatures$
        .pipe(
          filter(features => features != null && features.length > 0),
          take(1)
        )
        .subscribe(features => {
          if (features.includes(LicenseFeatureCode.extension)) {
            // only get teams when org has phone system license
            // when phone system license is per agent type
            const identityUuid = this.profileQuery.identityUuid;

            this.teamService.getTeams(X.orgUuid).subscribe();
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
          } else {
            this.filterFG.get('teamUuid').disable();
          }
        });
    }
  }

  private async _initControls(): Promise<void> {
    this.filterFG = this.fb.group({
      teamUuid: [],
      searchMember: ['']
    });

    this.filterFG.controls['teamUuid'].valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroySubscriber$))
      .subscribe(async value => {
        switch (value) {
          case 'system':
            this.isAgentView = false;
            this.filterFG.get('searchMember').setValue(null);
            break;
          case 'me':
            this.isAgentView = true;
            this.filterFG.get('searchMember').setValue(this.me);
            break;
          default:
            this.isAgentView = true;
            const members = await this._getMembers();

            if (!members.length) {
              this.filterFG.get('searchMember').setValue(null);
            } else {
              const searchString = this.filterFG.get('searchMember').value;

              const extKey = this.isMeView
                ? (searchString as ExtensionBase)?.extKey
                : (searchString as DirectoryMember)?.extensionKey;

              const shouldUpdateMembers = !searchString || members.findIndex(m => m.extensionKey === extKey) === -1;
              if (shouldUpdateMembers) {
                this.filterFG.get('searchMember').setValue(members[0]);
              }
            }

            break;
        }

        const firstMenu = this.menus.find(m => (this.isAgentView ? m.isAgentView : !m.isAgentView));
        if (firstMenu) {
          this.router.navigate([firstMenu.urlPath]);
        }
      });

    this.filterFG.controls['searchMember'].valueChanges
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

  private async _getMembers(): Promise<DirectoryMember[]> {
    const req = <GetDirectoryMembersReq>{
      filterExtension: true,
      status: [MemberStatus.active, MemberStatus.pending],
      sort: 'asc'
    };

    const { teamUuid, searchMember } = this.filterFG.value;
    if (!(searchMember instanceof DirectoryMember) && !(searchMember instanceof ExtensionBase)) {
      req.keyword = searchMember;
    }
    if (!['me', 'system', 'everyone'].includes(teamUuid)) {
      req.team = teamUuid;
    }

    return await this.directoryService
      .getMembers(req, { page: 0, perPage: 10 })
      .pipe(map(page => page.content))
      .toPromise();
  }

  private _updateMenuItems(org: ProfileOrg) {
    this.meFeatureQuery.features$
      .pipe(
        filter(features => features != null && features.length > 0),
        take(1)
      )
      .subscribe(_ => {
        if ((org.isUpperAdmin && this.meFeatureQuery.hasContactCenterLicense) || org.isSuperAdmin) {
          this.menus.push(
            {
              urlPath: APP_LINK.admin + '/' + ADMIN_LINK.queueManagement,
              displayText: 'Queue Management',
              dependLicenseCheck: true
            } // cc license
          );
          this.menus.push({
            urlPath: APP_LINK.admin + '/' + ADMIN_LINK.surveyTemplate,
            displayText: 'Survey Template'
          });
        }
      });

    this.orgFeatureQuery.selectAllFeatures$
      .pipe(
        filter(features => features != null && features.length > 0),
        take(1)
      )
      .subscribe(features => {
        if (features.includes(LicenseFeatureCode.extension)) {
          this.menus.push(...PHONE_SYSTEM_PER_AGENT_MENUS);
        }

        // only admin has these menu
        if (org.isUpperAdmin) {
          this.menus.push({
            urlPath: APP_LINK.admin + '/' + ADMIN_LINK.inboxManagement,
            displayText: 'Inbox Management'
          });

          if (features.includes(LicenseFeatureCode.microsoft_team)) {
            this.menus.push({
              urlPath: APP_LINK.admin + '/' + ADMIN_LINK.microsoftTeams,
              displayText: 'Microsoft Teams'
            }); // msteam license);
          }
          if (features.includes(LicenseFeatureCode.auto_attendant)) {
            this.menus.push({
              urlPath: APP_LINK.admin + '/' + ADMIN_LINK.autoAttendant,
              displayText: 'Auto Attendant'
            });
          }

          if (features.includes(LicenseFeatureCode.extension)) {
            this.menus.push(...PHONE_SYSTEM_ADMIN_VIEW_MENUS);
          }

          if (
            features.includes(LicenseFeatureCode.auto_attendant) ||
            features.includes(LicenseFeatureCode.extension) ||
            features.includes(LicenseFeatureCode.license_sip)
          ) {
            // ocr apply for phone sytem and auto attendant
            this.menus.push({
              urlPath: APP_LINK.admin + '/' + ADMIN_LINK.outboundCallRule,
              displayText: 'Outbound Call Rules'
            });
          }

          if (features.includes(LicenseFeatureCode.extension) || features.includes(LicenseFeatureCode.license_sip)) {
            // ocr apply for phone sytem and auto attendant
            this.menus.push({
              urlPath: APP_LINK.admin + '/' + ADMIN_LINK.inboundCallRule,
              displayText: 'Inbound Call Rule'
            });
          }
        }

        this.menus.sort(this._sortMenuFunc);
      });

    this.orgPolicyQuery
      .selectAll()
      .pipe(
        filter(list => list != null && list.length > 0),
        take(1)
      )
      .subscribe(_ => {
        const enableBookingMeetingIAM = this.orgPolicyQuery.getGrantedIAM(
          X.orgUuid,
          IAM_SERVICES.ui,
          IAM_UI_ACTIONS.show_org_menu
        );
        if (enableBookingMeetingIAM?.hasResource(IAM_UI_RESOURCES.meetings)) {
          this.menus.push({
            urlPath: APP_LINK.admin + '/' + ADMIN_LINK.bookingMeeting,
            displayText: 'Meeting'
          }); // meeting iam
        }

        const enableUWIAM = this.orgPolicyQuery.getGrantedIAM(
          X.orgUuid,
          IAM_SERVICES.ui,
          IAM_UI_ACTIONS.enableUWFeature
        );
        if (enableUWIAM?.hasResource(IAM_UI_RESOURCES.email)) {
          this.menus.push({
            urlPath: APP_LINK.admin + '/' + ADMIN_LINK.emailConfig,
            displayText: 'Email Configuration'
          }); //specific item for email license
        }

        this.menus.sort(this._sortMenuFunc);
      });
  }

  private _sortMenuFunc(a, b) {
    const ordering =
      a.order != null && b.order != null ? a.order - b.order : a.order != null ? -1 : b.order != null ? 1 : 0;
    return !ordering ? a.displayText.localeCompare(b.displayText) : ordering;
  }
}

interface MenuItem {
  urlPath: string;
  displayText: string;
  order?: number;
  isAgentView?: boolean;
  dependLicenseCheck?: boolean;
}

const PHONE_SYSTEM_PER_AGENT_MENUS: MenuItem[] = [
  // agent list view
  { urlPath: APP_LINK.user + '/' + USER_LINK.overview, displayText: 'Overview', order: 0, isAgentView: true },
  { urlPath: APP_LINK.user + '/' + USER_LINK.callForwarding, displayText: 'Call Forwarding', isAgentView: true },

  { urlPath: APP_LINK.user + '/' + USER_LINK.delegate, displayText: 'Delegate', isAgentView: true },
  { urlPath: APP_LINK.user + '/' + USER_LINK.devices, displayText: 'Devices', isAgentView: true },

  { urlPath: APP_LINK.user + '/' + USER_LINK.inboundCall, displayText: 'Inbound Call', isAgentView: true },
  { urlPath: APP_LINK.user + '/' + USER_LINK.inboundCallFilter, displayText: 'Inbound Call Filter', isAgentView: true },
  {
    urlPath: APP_LINK.user + '/' + USER_LINK.inboundMissedCalls,
    displayText: 'Inbound Missed Calls',
    isAgentView: true
  },
  { urlPath: APP_LINK.user + '/' + USER_LINK.musicOnHold, displayText: 'Music on Hold', isAgentView: true },
  { urlPath: APP_LINK.user + '/' + USER_LINK.outboundCall, displayText: 'Outbound Call', isAgentView: true },
  { urlPath: APP_LINK.user + '/' + USER_LINK.workingHours, displayText: 'Working Hours', isAgentView: true }
];

const PHONE_SYSTEM_ADMIN_VIEW_MENUS: MenuItem[] = [
  //admin list
  {
    urlPath: APP_LINK.admin + '/' + ADMIN_LINK.generalSettings,
    displayText: 'General Settings',
    order: 1
  },
  { urlPath: APP_LINK.admin + '/' + ADMIN_LINK.adminTools, displayText: 'Admin Tools' },
  { urlPath: APP_LINK.admin + '/' + ADMIN_LINK.busyLampField, displayText: 'Busy Lamp Field' },
  { urlPath: APP_LINK.admin + '/' + ADMIN_LINK.callGroup, displayText: 'Call Groups' },
  { urlPath: APP_LINK.admin + '/' + ADMIN_LINK.ipPhone, displayText: 'IP Phone Management' }
];
