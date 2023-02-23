import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { CheckOrganizationResponse, OrganizationService } from '@b3networks/api/auth';
import {
  CaseDetail,
  CaseIdentity,
  CaseQuery,
  CaseService,
  MetaData,
  SCMetaDataQuery,
  UpdateCaseReq,
  User,
  UserQuery
} from '@b3networks/api/workspace';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { MatDatepickerInputEvent } from '@matheo/datepicker';
import { startOfDay, subDays } from 'date-fns';
import { combineLatest, lastValueFrom, Observable, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  map,
  mergeMap,
  takeUntil,
  tap
} from 'rxjs/operators';

@Component({
  selector: 'b3n-case-info',
  templateUrl: './case-info.component.html',
  styleUrls: ['./case-info.component.scss']
})
export class CaseInfoComponent extends DestroySubscriberComponent implements OnInit, OnDestroy {
  @Input() me: User;
  @Input() case: CaseDetail;

  private _caseId: CaseIdentity;

  assignees$: Observable<User[]>;
  affectedOrganization$: Observable<CheckOrganizationResponse>;
  products$: Observable<string[]>;
  type$: Observable<MetaData>;
  severity$: Observable<MetaData>;
  reporter$: Observable<User>;

  allProducts$ = this.caseMetadataQuery.productList$;
  allTypes$ = this.caseMetadataQuery.typeList$;
  allSeverities$ = this.caseMetadataQuery.severityList$;

  searchOrgFC = this.fb.control('');
  checkedOrgResult$: Observable<CheckOrganizationResponse>;

  minDate = subDays(new Date(), 1);

  constructor(
    private caseQuery: CaseQuery,
    private caseService: CaseService,
    private userQuery: UserQuery,
    private organizationService: OrganizationService,
    private caseMetadataQuery: SCMetaDataQuery,
    private toastr: ToastService,
    private fb: FormBuilder
  ) {
    super();
  }

  ngOnInit(): void {
    this._handleSearchOrgForm();

    this.caseQuery
      .selectActiveId()
      .pipe(takeUntil(this.destroySubscriber$), distinctUntilChanged())
      .subscribe(() => {
        this._caseId = this.caseQuery.getActive() as { id; sid; ownerOrgUuid };
        this.caseService.getAssignees(this._caseId).subscribe();

        this.assignees$ = this.caseQuery
          .selectActive(e => e.assignees)
          .pipe(
            filter(l => l != null),
            mergeMap(l => this.userQuery.selectAllUserByIdentityIds(l))
          );

        this.affectedOrganization$ = this.caseQuery
          .selectActive(e => e.srcOrgUuid)
          .pipe(
            filter(l => l != null),
            mergeMap(l => (!l ? of(null) : this.organizationService.checkOrgUuid(l))),
            tap(r => console.log(r))
          );

        this.products$ = combineLatest([
          this.caseQuery.selectActive(e => e.productIds),
          this.caseMetadataQuery.productList$
        ]).pipe(
          filter(([productids, products]) => productids?.length > 0 && products?.length > 0),
          map(([productIds, products]) => {
            return products.filter(p => productIds.includes(p.id)).map(p => p.name);
          })
        );

        this.type$ = combineLatest([this.caseQuery.selectActive(e => e.typeId), this.caseMetadataQuery.typeList$]).pipe(
          filter(([typeId, types]) => typeId && types?.length > 0),
          map(([typeId, types]) => {
            return types.find(i => i.id === typeId);
          })
        );

        this.severity$ = combineLatest([
          this.caseQuery.selectActive(e => e.severityId),
          this.caseMetadataQuery.severityList$
        ]).pipe(
          filter(([id, list]) => id && list?.length > 0),
          map(([id, list]) => {
            return list.find(i => i.id === id);
          })
        );

        this.reporter$ = this.caseQuery.selectActive().pipe(
          filter(l => l != null),
          distinctUntilKeyChanged('createdByIdentity'),
          mergeMap(l => {
            if (l.ownerOrgUuid !== X.orgUuid) {
              return of(
                new User({
                  identityUuid: l.createdByIdentity,
                  uuid: l.createdByIdentity,
                  name: l.createdByIdentityName,
                  displayName: l.createdByIdentityName
                })
              );
            }
            return this.userQuery.selectUserByUuid(l.createdByIdentity);
          })
        );
      });
  }

  async onSelectedUserChange(user: User) {
    console.log(user);
    if (user && this.case.assignees?.includes(user.uuid)) {
      return;
    }
    if (this.case.assignees?.length) {
      for (let i = 0; i < this.case.assignees.length; i++) {
        await lastValueFrom(this.caseService.updateAssignee(this._caseId, 'remove', this.case.assignees[i]));
      }
    }

    if (user) {
      await lastValueFrom(this.caseService.updateAssignee(this._caseId, 'add', user.uuid));
      this.toastr.success('Assigned case');
    } else {
      this.toastr.success('Unassigned user to this case');
    }
  }

  async updateSourceOrg(org?: CheckOrganizationResponse) {
    if (org) {
      const orgUuid = this.searchOrgFC.value;
      if (orgUuid === this.case.srcOrgUuid) {
        this.toastr.warning('Should reassign to another organization');
        return;
      }
      await this._updateCase(this._caseId, <UpdateCaseReq>{ srcDomain: org.domain, srcOrgUuid: orgUuid });
      this.toastr.success('Changed organization info');
    } else {
      await this._updateCase(this._caseId, <UpdateCaseReq>{ srcDomain: null, srcOrgUuid: null });
      this.toastr.success('Unassigned organization info');
    }
  }

  async onTypeChange(event: number) {
    if (this.case.typeId !== event) {
      await this._updateCase(this._caseId, <UpdateCaseReq>{ typeId: event });
      this.toastr.success('Changed case type');
    }
  }

  async onSeverityChange(event: number) {
    if (this.case.severityId !== event) {
      await this._updateCase(this._caseId, <UpdateCaseReq>{ severityId: event });
      this.toastr.success('Changed case severity');
    }
  }

  async onProductChange(newProductIds: number[]) {
    const removingProductIds = this.case.productIds.filter(p => !newProductIds.includes(p));
    const addingProductIds = newProductIds.filter(p => !this.case.productIds.includes(p));

    if (!removingProductIds.length && !addingProductIds.length) {
      // nohting todo
      return;
    }

    await this._updateCase(this._caseId, <UpdateCaseReq>{
      addProductIds: addingProductIds,
      removeProductIds: removingProductIds
    }).then(() => {
      this.toastr.success('Changed case products');
    });
  }

  async onDueDateChange(event: MatDatepickerInputEvent<Date>) {
    const newDueDate = startOfDay(event.value);

    if (newDueDate.getTime() === this.case.dueAt) {
      return;
    }

    const body = <UpdateCaseReq>{
      dueDate: newDueDate.getTime()
    };
    await this._updateCase(this._caseId, body);
    this.toastr.success('Updated due date');
  }

  private async _updateCase(id: CaseIdentity, req: Partial<UpdateCaseReq>) {
    await lastValueFrom(this.caseService.updateCase(id, req)).catch(e => this.toastr.warning(e.message));
  }

  private _handleSearchOrgForm() {
    this.checkedOrgResult$ = this.searchOrgFC.valueChanges.pipe(
      debounceTime(300),
      mergeMap(value => this.organizationService.checkOrgUuid(value).pipe(catchError(() => of(null)))),
      tap(r => console.log(r))
    );
  }
}
