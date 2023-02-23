import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  GetMembersReq,
  IAMGrantedPermission,
  IAMMember,
  IamService,
  IdentityProfile,
  IdentityProfileQuery,
  Member,
  MemberRole,
  MemberStatus,
  OrgMemberService
} from '@b3networks/api/auth';
import { Pageable } from '@b3networks/api/common';
import { Dashboard2, DashboardPermission, DashboardV2Service, IAM_DASHBOARD_SERVICE } from '@b3networks/api/dashboard';
import { DEFAULT_WARNING_MESSAGE } from '@b3networks/portal/setting';
import { arrMinLengthValidator, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { cloneDeep } from 'lodash';
import { debounceTime, filter, firstValueFrom, map, Observable, Subject, switchMap, takeUntil, tap } from 'rxjs';

type SelectedDashboardForm = FormGroup<{
  dashboard: FormControl<Dashboard2>;
  readonly: FormControl<boolean>;
  manage: FormControl<boolean>;
}>;

type StorePermissionForm = FormGroup<{
  searchMember: FormControl<string | Member>;
  member: FormControl<Member>;
  searchDashboard: FormControl<string | Dashboard2>;
  selectedDashboards: FormControl<SelectedDashboardForm[]>;
}>;

@Component({
  selector: 'b3n-store-permission',
  templateUrl: './store-permission.component.html',
  styleUrls: ['./store-permission.component.scss']
})
export class StorePermissionComponent implements OnInit, OnDestroy, OnChanges {
  @Input() dashboards: Dashboard2[] = [];
  @Input() iamMember: IAMMember;
  @Input() iamMembers: IAMMember[] = [];
  @Output() close = new EventEmitter();

  readonly GetMembersReq: GetMembersReq = {
    orgUuid: X.orgUuid,
    status: MemberStatus.active,
    sort: 'identity.givenName,asc',
    filterByRoles: [MemberRole.MEMBER]
  };

  dashboardsFilter: Dashboard2[] = [];
  form: StorePermissionForm;
  members: Member[] = [];
  membersFilter: Member[] = [];
  loading = true;
  saving = false;
  pageable: Pageable = {
    page: 0,
    perPage: 20
  };
  init = true;
  baseReadonlyUuids = [];
  baseManageUuids = [];
  profile: IdentityProfile;

  destroy$ = new Subject<boolean>();
  destroyDashboardMap$: HashMap<Subject<boolean>> = {};

  constructor(
    private fb: FormBuilder,
    private iamService: IamService,
    private toastService: ToastService,
    private orgMemberService: OrgMemberService,
    private dashboardV2Service: DashboardV2Service,
    private identityProfileQuery: IdentityProfileQuery
  ) {
    this.profile = this.identityProfileQuery.getProfile();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();

    for (const uuid in this.destroyDashboardMap$) {
      const destroyDashboard$ = this.destroyDashboardMap$[uuid];
      destroyDashboard$.next(true);
      destroyDashboard$.complete();
      this.destroyDashboardMap$[uuid] = new Subject<boolean>();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.init) {
      return;
    }

    const iamMemberChange = changes['iamMember'];

    if (!iamMemberChange) {
      return;
    }

    this.iamMember = iamMemberChange.currentValue as IAMMember;

    if (!this.iamMember) {
      this.selectedDashboards.setValidators(arrMinLengthValidator(1));
      this.selectedDashboards.updateValueAndValidity();
      return;
    }

    this.selectedDashboards.clearValidators();
    this.selectedDashboards.updateValueAndValidity();
    this.handleIamMember();
  }

  async ngOnInit() {
    this.initForm();
    await this.initData();
    this.init = false;

    if (!this.iamMember) {
      return;
    }

    this.handleIamMember();
  }

  async initData() {
    this.loading = true;

    try {
      const members = await firstValueFrom(
        this.orgMemberService.getMembers(
          {
            ...this.GetMembersReq,
            keyword: ''
          },
          this.pageable
        )
      );

      this.members = members.content;
      this.membersFilter = this.members.filter(member => {
        if (this.iamMember) {
          return ![...this.iamMembers, this.profile.memberUuid].includes(member.memberUuid);
        } else {
          return !this.iamMembers.map(m => m.memberUuid).includes(member.memberUuid);
        }
      });
      this.dashboardsFilter = cloneDeep(this.dashboards);
      this.dashboards.forEach(dashboard => {
        this.destroyDashboardMap$[dashboard.uuid] = new Subject<boolean>();
      });
    } catch (e) {
      this.toastService.error(e['message'] ?? DEFAULT_WARNING_MESSAGE);
    } finally {
      this.loading = false;
    }
  }

  async handleIamMember() {
    this.baseReadonlyUuids = [];
    this.baseManageUuids = [];

    try {
      const member = await firstValueFrom(this.orgMemberService.getMember(X.orgUuid, this.iamMember.memberUuid, false));

      this.member.setValue(member);

      const selectedDashboardMap = this.dashboardV2Service.getDashboardMap(this.iamMember);

      if (selectedDashboardMap === null || selectedDashboardMap === '*') {
        return;
      }

      for (const uuid in selectedDashboardMap) {
        const dashboard = this.dashboards.find(d => d.uuid === uuid);

        if (!dashboard) {
          continue;
        }

        const map = selectedDashboardMap[uuid];
        const readonly = map[DashboardPermission.READONLY] ?? false;
        const manage = map[DashboardPermission.MANAGE] ?? false;

        if (readonly) {
          this.baseReadonlyUuids.push(uuid);
        }

        if (manage) {
          this.baseManageUuids.push(uuid);
        }

        const selectedDashboardForm: SelectedDashboardForm = this.fb.group({
          dashboard: [dashboard],
          readonly: [readonly],
          manage: [null]
        });

        const manageFC = selectedDashboardForm.controls['manage'];

        if (dashboard.isDefault) {
          manageFC.disable();
        }

        manageFC.valueChanges
          .pipe(
            takeUntil(this.destroyDashboardMap$[dashboard.uuid]),
            tap(manage => {
              const readonlyFC = selectedDashboardForm.controls['readonly'];

              if (manage) {
                readonlyFC.setValue(true);
                readonlyFC.disable();
              } else {
                readonlyFC.enable();
              }
            })
          )
          .subscribe();

        manageFC.setValue(manage);
        this.selectedDashboards.setValue([...(this.selectedDashboards.value ?? []), selectedDashboardForm]);
      }

      this.searchDashboard.setValue('');
    } catch (e) {
      this.toastService.error(e['message'] ?? DEFAULT_WARNING_MESSAGE);
    }
  }

  initForm() {
    this.form = this.fb.group({
      searchMember: [null],
      member: [null as Member, Validators.required],
      searchDashboard: [null],
      selectedDashboards: [[] as SelectedDashboardForm[], arrMinLengthValidator(1)]
    });

    if (this.iamMember) {
      this.selectedDashboards.clearValidators();
      this.selectedDashboards.updateValueAndValidity();
    }

    this.handleSearchMember();
    this.handleSearchDashboard();
  }

  handleSearchMember() {
    this.searchMember.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        map(value => {
          if (value instanceof Member) {
            this.member.setValue(value);
            return true as boolean;
          }

          return value === null ? '' : value;
        }),
        filter(value => typeof value === 'string'),
        switchMap(value => {
          this.member.setValue(null);
          const keyword = (value as string).trim().toLowerCase();

          return this.orgMemberService.getMembers(
            {
              ...this.GetMembersReq,
              keyword: keyword
            },
            this.pageable
          );
        }),
        tap(memberPage => {
          this.membersFilter = memberPage.content.filter(member => {
            if (this.iamMember) {
              return ![...this.iamMembers, this.profile.memberUuid].includes(member.memberUuid);
            } else {
              return !this.iamMembers.map(m => m.memberUuid).includes(member.memberUuid);
            }
          });
        })
      )
      .subscribe();
  }

  handleSearchDashboard() {
    this.searchDashboard.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        tap(value => {
          const findSelectedDashboards = (uuid: string) => {
            const selectedDashboardForm = (this.selectedDashboards.value ?? []).find(s => {
              const dashboard = s.controls['dashboard'].value;
              return dashboard.uuid === uuid;
            });

            return selectedDashboardForm ? selectedDashboardForm.controls['dashboard'].value : null;
          };

          if (!(value instanceof Dashboard2)) {
            if (value === null) {
              value = '';
            }

            const keyword = value.trim().toLowerCase();
            this.dashboardsFilter = this.dashboards.filter(d => {
              return d.name.trim().toLowerCase().includes(keyword) && !findSelectedDashboards(d.uuid);
            });
            return;
          }

          if (!findSelectedDashboards(value.uuid)) {
            this.initSelectedDashboardForm(value);
          }

          this.searchDashboard.setValue('');
        })
      )
      .subscribe();
  }

  initSelectedDashboardForm(dashboard: Dashboard2) {
    const index = this.dashboards.findIndex(d => d.uuid === dashboard.uuid);

    if (index === -1) {
      return;
    }

    const selectedDashboardForm: SelectedDashboardForm = this.fb.group({
      dashboard: [dashboard],
      readonly: [true],
      manage: [false]
    });

    const manageFC = selectedDashboardForm.controls['manage'];

    if (dashboard.isDefault) {
      manageFC.disable();
    }

    manageFC.valueChanges
      .pipe(
        takeUntil(this.destroyDashboardMap$[dashboard.uuid]),
        tap(manage => {
          const readonlyFC = selectedDashboardForm.controls['readonly'];

          if (manage) {
            readonlyFC.setValue(true);
            readonlyFC.disable();
          } else {
            readonlyFC.enable();
          }
        })
      )
      .subscribe();

    if (!!selectedDashboardForm) {
      this.selectedDashboards.setValue([...(this.selectedDashboards.value ?? []), selectedDashboardForm]);
    }
  }

  removeSelectedDashboardForm(dashboard: Dashboard2) {
    const index = this.dashboards.findIndex(d => d.uuid === dashboard.uuid);

    if (index === -1) {
      return;
    }

    const destroyDashboard$ = this.destroyDashboardMap$[dashboard.uuid];
    destroyDashboard$.next(true);
    destroyDashboard$.complete();
    this.destroyDashboardMap$[dashboard.uuid] = new Subject<boolean>();

    const selectedDashboards = (this.selectedDashboards.value ?? []).filter(d => {
      const dashboardValue = d.controls['dashboard'].value;
      return dashboardValue.uuid !== dashboard.uuid;
    });

    this.selectedDashboards.setValue(selectedDashboards);
    this.searchDashboard.setValue('');
  }

  memberDisplayFn(member: Member) {
    return member ? member.displayName : '';
  }

  dashboardDisplayFn(dashboard: Dashboard2) {
    return dashboard ? dashboard.name : '';
  }

  cancel(refresh: boolean = false) {
    this.close.emit(refresh);
    this.form.reset();
    this.dashboardsFilter = cloneDeep(this.dashboards);
  }

  async save() {
    this.saving = true;

    const readonlyList: string[] = [];
    const manageList: string[] = [];
    const member = this.member.value;

    this.selectedDashboards.value.forEach(form => {
      const selectedDashboard = form.getRawValue();
      const uuid = selectedDashboard.dashboard.uuid;

      if (selectedDashboard.readonly) {
        readonlyList.push(uuid);
      }

      if (selectedDashboard.manage) {
        manageList.push(uuid);
      }
    });

    const obsArr: Observable<Object>[] = [];

    if (this.baseReadonlyUuids.length && this.iamMember) {
      const baseReadonlyPermission: Partial<IAMGrantedPermission> = {
        service: IAM_DASHBOARD_SERVICE,
        action: DashboardPermission.READONLY,
        resources: this.baseReadonlyUuids
      };

      obsArr.push(this.iamService.removeIAMMember(X.orgUuid, member.memberUuid, baseReadonlyPermission));
    }

    if (this.baseManageUuids.length && this.iamMember) {
      const baseManagePermission: Partial<IAMGrantedPermission> = {
        service: IAM_DASHBOARD_SERVICE,
        action: DashboardPermission.MANAGE,
        resources: this.baseManageUuids
      };

      obsArr.push(this.iamService.removeIAMMember(X.orgUuid, member.memberUuid, baseManagePermission));
    }

    if (readonlyList.length) {
      const readonlyPermission: Partial<IAMGrantedPermission> = {
        service: IAM_DASHBOARD_SERVICE,
        action: DashboardPermission.READONLY,
        resources: readonlyList
      };

      obsArr.push(this.iamService.appendIAMMember(X.orgUuid, member.memberUuid, readonlyPermission));
    }

    if (manageList.length) {
      const managePermission: Partial<IAMGrantedPermission> = {
        service: IAM_DASHBOARD_SERVICE,
        action: DashboardPermission.MANAGE,
        resources: manageList
      };

      obsArr.push(this.iamService.appendIAMMember(X.orgUuid, member.memberUuid, managePermission));
    }

    try {
      for (let i = 0; i < obsArr.length; i++) {
        const obs$ = obsArr[i];
        await firstValueFrom(obs$);
      }

      this.toastService.success(`Assign successfully`);
      this.cancel(true);
    } catch (error) {
      this.toastService.error(error['message'] ?? DEFAULT_WARNING_MESSAGE);
    } finally {
      this.saving = false;
    }
  }

  get searchMember() {
    return this.form.controls['searchMember'];
  }

  get member() {
    return this.form.controls['member'];
  }

  get searchDashboard() {
    return this.form.controls['searchDashboard'];
  }

  get selectedDashboards() {
    return this.form.controls['selectedDashboards'];
  }
}
