import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatDrawer } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import {
  GetMembersReq,
  IdentityProfileQuery,
  Member,
  MemberStatus,
  OrgMemberQuery,
  OrgMemberService,
  Team,
  TeamQuery,
  TeamService
} from '@b3networks/api/auth';
import { ExtensionService } from '@b3networks/api/callcenter';
import { Page, Pageable } from '@b3networks/api/common';
import {
  AddonLicenseMapping,
  GetLicenseReq,
  License,
  LicenseService,
  LicenseStatistic,
  LicenseStatQuery,
  LicenseStatsData,
  LicenseStatService,
  ResourceDetail
} from '@b3networks/api/license';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { combineLatest, forkJoin, Observable, of, Subject } from 'rxjs';
import { debounceTime, filter, finalize, map, startWith, takeUntil } from 'rxjs/operators';
import { AddonStatsDetailComponent, AddonStatsDetailInput } from './addon-stats-detail/addon-stats-detail.component';
import { AssignUsersComponent, AssignUsersInput } from './assign-users/assign-users.component';
import { LicenseDetailEvent } from './license-detail/license-detail.component';
import { MassConfigurationComponent } from './mass-configuration/mass-configuration.component';
import { ProvisionExtComponent, ProvisionExtInput } from './provision-ext/provision-ext.component';

@Component({
  selector: 'b3n-assignment-page',
  templateUrl: './assignment-page.component.html',
  styleUrls: ['./assignment-page.component.scss']
})
export class AssignmentPageComponent extends DestroySubscriberComponent implements OnInit {
  // statistic
  licenseStatistic: LicenseStatistic;

  isManagedEveryone: boolean;
  managedTeams: Team[] = [];

  //addon stats
  addonStats: LicenseStatistic[];
  addonStat: LicenseStatsData;

  licensePage: Page<License>;
  selectedLicense: License | null;

  isLoading: boolean;

  selectedMember: Member;
  members$: Observable<Member[]>;

  filterFG: UntypedFormGroup;
  filterChanged$ = new Subject<boolean>();

  mappingConfig: HashMap<number> = {};

  unprovisionedNumber: number;

  pageable: Pageable = { page: 0, perPage: 10 };

  displayedColumns = [];

  OBJECT_KEYS_FUNC = Object.keys;

  @ViewChild(MatDrawer) rightDrawer: MatDrawer;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private profileQuery: IdentityProfileQuery,
    private licenseService: LicenseService,
    private memberQuery: OrgMemberQuery,
    private orgMemberService: OrgMemberService,
    private licenseStatQuery: LicenseStatQuery,
    private licenseStatService: LicenseStatService,
    private teamQuery: TeamQuery,
    private teamService: TeamService,
    private extensionService: ExtensionService,
    private dialog: MatDialog,
    private fb: UntypedFormBuilder,
    private toastService: ToastService
  ) {
    super();
    this._initForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.licenseStatQuery
        .selectEntity(params['sku'])
        .pipe(
          filter(l => l != null),
          takeUntil(this.destroySubscriber$)
        )
        .subscribe(license => {
          console.log(`license changed`);

          this.licenseStatistic = license;
          console.log(this.licenseStatistic);

          if (this.licenseStatistic.isPerUserLicense) {
            this.displayedColumns = ['assignedUser'];
            if (this.licenseStatistic.isExtension) {
              this.displayedColumns.unshift('extension');
            }
          } else {
            this.displayedColumns = ['subscriptionUuid'];
          }

          this.getMappingConfig();

          if (this.licenseStatistic.hasResource) {
            this.licenseService
              .getLicenses(<GetLicenseReq>{ hasResource: false, skus: [this.licenseStatistic.sku] }, {
                page: 0,
                perPage: 1
              })
              .subscribe(page => {
                this.unprovisionedNumber = page.totalCount;
              });
          }

          if (this.licenseStatistic.isPerUserLicense) {
            const memberUuid = this.profileQuery.getProfile().uuid;
            combineLatest([this.teamQuery.selectAll(), this.teamQuery.selectAllManagedByAdmin(memberUuid)])
              .pipe(takeUntil(this.destroySubscriber$))
              .subscribe(([teams, managedTeams]) => {
                const profileOrg = this.profileQuery.currentOrg;

                this.isManagedEveryone = profileOrg.isOwner || !profileOrg.licenseEnabled || !managedTeams.length;
                this.managedTeams = this.isManagedEveryone ? teams : managedTeams;

                let teamUuid = this.filterFG.value.teamUuid;
                if (!this.isManagedEveryone && this.managedTeams.length && !this.filterFG.value.teamUuid) {
                  teamUuid = this.managedTeams[0].uuid;
                }
                if (this.filterFG.value.teamUuid !== teamUuid) {
                  this.filterFG.get('teamUuid').setValue(teamUuid);
                } else {
                  this.filterChanged$.next(true);
                }
              });

            this.teamService.getTeams(X.orgUuid).subscribe();
            this.teamService.getTeamsManagedByAdmin(X.orgUuid, memberUuid).subscribe();
          }
        });
    });

    this.members$ = this.memberQuery.members$;

    this.licenseStatService.getLicenseStatistics({ useCache: true }).subscribe();
    this.extensionService.getAllExtenison().subscribe();
  }

  refreshPage() {
    if (!this.licenseStatistic) {
      return;
    }

    this.isLoading = true;
    const req = <GetLicenseReq>{
      skus: [this.licenseStatistic.sku],
      identityUuid: this.selectedMember ? this.selectedMember.uuid : '',
      resourceKey: this.filterFG.get('searchString').value,
      includeMappings: true,
      includeResources: true,
      hasResource: this.licenseStatistic.hasResource ? true : null,
      hasUser: this.licenseStatistic.isPerUserLicense ? true : null, // support developer assign multiple users
      teamUuid: this.filterFG.get('teamUuid').value
    };

    this.licenseService.getLicenses(req, this.pageable).subscribe(page => {
      const ids = [];
      page.content.forEach(l => {
        l.mappings.forEach(m => {
          if (m.isExtension || m.isNumber) {
            ids.push(m.id);
          }
        });
      });

      const identityUuids = page.content.filter(l => !!l.identityUuid).map(l => l.identityUuid);
      forkJoin([
        identityUuids.length
          ? this.orgMemberService
              .getMembers(
                { orgUuid: X.orgUuid, memberUuids: identityUuids },
                { page: 0, perPage: 100 },
                { ignoreStore: true }
              )
              .pipe(map(p => p.content))
          : of([]),
        ids.length ? this.licenseService.getResource(ids) : of([]) //  get extension resource for base mapping
      ])
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe(([members, resources]) => {
          page.content.forEach(l => {
            const member = members.find(m => m.uuid === l.identityUuid);
            if (member) {
              l.assignedUser = member.displayName;
            } else {
              l.assignedUser = '-';
            }

            l.mappings.forEach(b => {
              const mapping = this.licenseStatQuery.getAll().find(i => i.sku === b.sku);
              if (mapping) {
                b.skuName = mapping.skuName;
              }
              if (b.isNumber || b.isExtension) {
                const resource = resources.find(r => r.licenseId === b.id);
                if (resource) {
                  b.resource = <ResourceDetail>{
                    key: resource.info.extKey || resource.info.number,
                    info: resource.info
                  };
                }
              }

              l.activatedLicenses = l.mappings.length ? l.mappings.map(m => m.displayText).join(', ') : '-';
            });
          });

          page.content = page.content.sort(
            (a, b) => a.type.localeCompare(b.type) * -1 || a.displayText.localeCompare(b.displayText)
          );
          this.licensePage = page;

          page.content.forEach(license => {
            if (!license.mappings?.length) {
              return;
            }

            license.addonLicenseMappings = license.mappings.reduce<AddonLicenseMapping[]>((prev, curr) => {
              const addon = prev.find(a => a.sku === curr.sku);

              if (!addon) {
                prev.push({
                  sku: curr.sku,
                  skuName: curr.skuName,
                  quantity: 1,
                  displayText: curr.skuName,
                  isNumber: curr.isNumber
                });
              } else {
                addon.quantity++;
                addon.displayText = `${addon.quantity} ${addon.skuName}`;
              }

              return prev;
            }, []);

            license.activatedLicenses = '';

            license.addonLicenseMappings.forEach((a, i) => {
              license.activatedLicenses +=
                i === license.addonLicenseMappings.length - 1 ? a.displayText : `${a.displayText}, `;
            });
          });

          if (this.selectedLicense) {
            this.selectedLicense = this.licensePage.content.find(l => l.id === this.selectedLicense.id);
          }
        });
    });
  }

  showAddonsDetail() {
    this.dialog.open(AddonStatsDetailComponent, {
      width: '680px',
      disableClose: true,
      data: <AddonStatsDetailInput>{
        licenseStats: this.addonStats
      }
    });
  }

  showDetails(l: License) {
    this.selectedLicense = l;
    this.rightDrawer.open();
  }

  openMassConfigDialog() {
    this.dialog
      .open(MassConfigurationComponent, {
        width: '480px',
        autoFocus: false,
        disableClose: true
      })
      .afterClosed()
      .subscribe(success => {
        if (success) {
          this.licenseChanged();
        }
      });
  }

  provision() {
    this.dialog
      .open(ProvisionExtComponent, {
        width: '450px',
        autoFocus: false,
        disableClose: true,
        data: <ProvisionExtInput>{
          licenseStatistic: this.licenseStatistic,
          mappingConfig: this.mappingConfig
        }
      })
      .afterClosed()
      .subscribe(success => {
        if (success) {
          this.licenseChanged();
        }
      });
  }

  assignUsers() {
    this.dialog
      .open(AssignUsersComponent, {
        width: '600px',
        disableClose: true,
        data: <AssignUsersInput>{
          licenseStatis: this.licenseStatistic,
          teamUuid: this.filterFG.value.teamUuid
        }
      })
      .afterClosed()
      .subscribe(success => {
        if (success) {
          this.licenseChanged();
        }
      });
  }

  onPageChange(event: PageEvent) {
    console.log(`page changed to ${event.pageIndex}`);

    this.pageable.page = event.pageIndex;
    this.refreshPage();
  }

  goBack() {
    this.router.navigate(['license']);
  }

  licenseChanged(event?: LicenseDetailEvent) {
    this.licenseStatService.getLicenseStatistics().subscribe(_ => {
      this.filterChanged$.next(true);
    });

    if (event && event.close) {
      this.rightDrawer.close();
    }
  }

  licenseTrackByFunc(_: number, item: LicenseStatistic) {
    return item?.sku || null;
  }

  memberDisplayFn(member: Member): string {
    return member ? member.displayName : '';
  }

  private getMembers(searchString?: string) {
    this.orgMemberService
      .getDirectoryMembers(
        <GetMembersReq>{
          orgUuid: X.orgUuid,
          keyword: searchString,
          sort: 'asc',
          team: this.filterFG.controls['teamUuid'].value,
          status: `${MemberStatus.active},${MemberStatus.pending}`
        },
        { page: 0, perPage: 10 }
      )
      .pipe(map(p => p.content))
      .subscribe();
  }

  private getMappingConfig() {
    this.licenseService.getMappingConfig(this.licenseStatistic.sku).subscribe(config => {
      this.mappingConfig = config;

      if (Object.keys(this.mappingConfig).length) {
        this.addonStat = <LicenseStatsData>{ assigned: 0, available: 0, total: 0 };
        const addonSKUS = Object.keys(this.mappingConfig);
        this.addonStats = this.licenseStatQuery.getAllAddonLicenses().filter(l => addonSKUS.includes(l.sku));

        this.addonStats.forEach(l => {
          this.addonStat.assigned += l.statsByMapping.assigned;
          this.addonStat.available += l.statsByMapping.available;
          this.addonStat.total += l.statsByMapping.total;
        });
      }

      const idx = this.displayedColumns.indexOf('activatedLicenses');
      if (Object.keys(this.mappingConfig).length && idx === -1) {
        this.displayedColumns.push('activatedLicenses');
      } else if (!Object.keys(this.mappingConfig).length && idx > -1) {
        this.displayedColumns.splice(idx);
      }

      if (this.licenseStatistic.isCallGroup) {
        this.displayedColumns.splice(1, 0, 'callGroupNumber');
      }
    });
  }

  private _initForm() {
    this.filterFG = this.fb.group({
      searchString: [''],
      teamUuid: [''],
      searchMember: ['']
    });

    this.filterFG
      .get('searchMember')
      .valueChanges.pipe(startWith(''), debounceTime(300))
      .subscribe(value => {
        console.log(`find member ${value}`);

        if (value instanceof Member || !value) {
          if (
            (!value && this.selectedMember) ||
            (value && !this.selectedMember) ||
            (value as Member)?.uuid !== this.selectedMember?.uuid
          ) {
            this.selectedMember = value || null;
          }
          this.filterChanged$.next(true);
        } else {
          this.getMembers(value);
        }
      });

    this.filterFG.get('teamUuid').valueChanges.subscribe(_ => {
      this.getMembers();
    });

    combineLatest([
      this.filterFG.get('teamUuid').valueChanges.pipe(startWith('')),
      this.filterFG.get('searchString').valueChanges.pipe(startWith('')),
      this.filterChanged$
    ])
      .pipe(debounceTime(200))
      .subscribe(([teamUuid, q]) => {
        this.pageable.page = !this.pageable?.page ? 0 : this.pageable.page;
        this.refreshPage();
      });
  }
}
