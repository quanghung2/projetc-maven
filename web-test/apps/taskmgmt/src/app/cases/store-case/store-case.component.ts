import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CheckOrganizationResponse, OrganizationService } from '@b3networks/api/auth';
import {
  Case,
  CaseDetail,
  CaseIdentity,
  CaseQuery,
  CaseService,
  CaseStatus,
  CollaboratorRole,
  MeQuery,
  MetaData,
  QueryCaseReq,
  SCMetaDataQuery,
  StoreCaseReq,
  Supplier,
  UpdateCaseReq,
  User,
  UserQuery
} from '@b3networks/api/workspace';
import { B3_ORG_UUID, DestroySubscriberComponent, LocalStorageUtil, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { subDays } from 'date-fns';
import { lastValueFrom, Observable, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  startWith,
  switchMap,
  tap
} from 'rxjs/operators';
import { EditorComponent } from '../../shared/component/editor/editor.component';
import { SelectSupplierComponent, SelectSupplierInput } from '../select-supplier/select-supplier.component';

const DRAFT_CASE_ID = 'sc_draft_case_sid';

@Component({
  selector: 'b3n-store-case',
  templateUrl: './store-case.component.html',
  styleUrls: ['./store-case.component.scss']
})
export class StoreCaseComponent extends DestroySubscriberComponent implements OnInit {
  private _mobileQueryListener: () => void;

  readonly CURRENT_ORG_UUID = X.orgUuid;
  readonly isB3Org = this.CURRENT_ORG_UUID === B3_ORG_UUID;
  readonly minDate = subDays(new Date(), 1);

  @HostListener('window:beforeunload', ['$event'])
  @HostListener('window:unload', ['$event'])
  caseFG: FormGroup;
  draftCase: CaseDetail;

  me$: Observable<User> = this.meQuery.me$;

  searchOrgFC = new FormControl('', Validators.required);
  checkedOrgResult$: Observable<CheckOrganizationResponse>;

  searchMemberFC = new FormControl();
  filteredMembers$: Observable<User[]>;

  searchCaseFC = new FormControl();
  relatedCases$: Observable<Case[]>;

  productFC = new FormControl();
  products$: Observable<MetaData[]>;

  loading = false;
  progressing = false;
  need2selectSuplier: boolean;

  mobileQuery: MediaQueryList;

  type$: Observable<MetaData[]> = this.caseMetadataQuery.typeList$;
  severity$: Observable<MetaData[]> = this.caseMetadataQuery.severityList$;
  suppliers$: Observable<Supplier[]> = this.caseMetadataQuery.suppliers$.pipe(
    tap(list => {
      this.need2selectSuplier = list?.length > 0;
    })
  );

  @ViewChild(EditorComponent) editor: EditorComponent;

  constructor(
    private organizationService: OrganizationService,
    private caseQuery: CaseQuery,
    private caseService: CaseService,
    private meQuery: MeQuery,
    private userQuery: UserQuery,
    private caseMetadataQuery: SCMetaDataQuery,
    private toastr: ToastService,
    private fb: FormBuilder,
    private router: Router,
    private dialog: MatDialog,
    private changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher
  ) {
    super();

    this.mobileQuery = media.matchMedia('(max-width: 768px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  async ngOnInit() {
    const draftCaseIden = LocalStorageUtil.getItem(DRAFT_CASE_ID) as CaseIdentity;
    if (draftCaseIden) {
      this.loading = true;
      await lastValueFrom(this.caseService.getCase(draftCaseIden.ownerOrgUuid, draftCaseIden.sid));
      await lastValueFrom(this.caseService.getRelatedCases(draftCaseIden));
      await lastValueFrom(this.caseService.getAssignees(draftCaseIden));
      this.draftCase = this.caseQuery.getEntity(draftCaseIden.id);
      this.loading = false;
    }
    this._initForm();
  }

  async onAccessControlRequired() {
    const { ownerUuid } = this.caseFG.value;
    if (!this.draftCase && this.need2selectSuplier) {
      this.dialog
        .open(SelectSupplierComponent, {
          width: '580px',
          data: <SelectSupplierInput>{
            currentOrgUuid: this.CURRENT_ORG_UUID,
            selectedSupplier: ownerUuid,
            suppliers: this.caseMetadataQuery.getValue().suppliers
          }
        })
        .afterClosed()
        .subscribe(async selectedOwner => {
          this.caseFG.get('ownerUuid').setValue(selectedOwner);
          await this._createDraftCase();
          this.caseFG.get('ownerUuid').disable();
        });
    } else if (!this.draftCase) {
      await this._createDraftCase();
      this.caseFG.get('ownerUuid').disable();
    }
  }

  private async _createDraftCase(status?: CaseStatus) {
    const { title, typeId, productIds, severityId, dueDate, relatedTos, assignee, srcOrgUuid, ownerUuid } =
      this.caseFG.getRawValue();
    const req = <StoreCaseReq>{
      title,
      typeId,
      productIds,
      severityId,
      ownerUuid,
      srcOrgUuid,
      status: status || CaseStatus.draft
    };
    if (assignee) {
      req.assignees = [assignee];
    }
    if (relatedTos) {
      req.relatedTos = relatedTos.map(r => r.sid);
    }
    if (dueDate) {
      req.dueDate = new Date(dueDate).getTime();
    }

    const data = this.editor.getContent();
    req.description = data.html;
    req.rawDescription = data.text;
    req.mentionIds = data.mentions;

    this.draftCase = await lastValueFrom(this.caseService.createCase(req));
    if (this.draftCase.status === CaseStatus.draft) {
      const iden: CaseIdentity = {
        id: this.draftCase.id,
        sid: this.draftCase.sid,
        ownerOrgUuid: this.draftCase.ownerOrgUuid
      };
      LocalStorageUtil.setItem(DRAFT_CASE_ID, iden);
    }
  }

  onBeforeUnload() {
    // if (this.unSaved) {
    //   return false;
    // } else {
    //   return true;
    // }
  }

  async canDeactivate() {
    // if (this.unSaved && !this.mobileQuery.matches) {
    //   const result = window.confirm('There are unsaved changes! Are you sure?');
    //   if (result) {
    //     this.isReturnData = true;
    //     this.isUnSave = true;
    //   }
    //   return Promise.resolve(result);
    // }
    return Promise.resolve(true);
  }

  async createCase() {
    this.progressing = true;

    console.log(this.caseFG.value);

    if (!this.draftCase) {
      // incase don't have upload files
      try {
        await this._createDraftCase(CaseStatus.open);
        this.toastr.success('Create case successfully');
        this.goToHome();
      } catch (e) {
        this.toastr.error(e?.['message']);
      }
    } else {
      // incase need create draft to upload files
      const { title, typeId, productIds, severityId, dueDate, relatedTos, assignee, srcOrgUuid } = this.caseFG.value;

      const req = <UpdateCaseReq>{
        title,
        typeId,
        severityId,
        srcOrgUuid,
        status: CaseStatus.open
      };

      if (!req.title) {
        req.title = 'A new case';
      }
      if (dueDate) {
        req.dueDate = new Date(dueDate).getTime();
      }

      const data = this.editor.getContent();

      req.description = data.html;
      req.rawDescription = data.text;
      req.mentionIds = data.mentions;

      const removingProductIds = this.draftCase.productIds.filter(p => !productIds.includes(p));
      const addingProductIds = productIds.filter(p => !this.draftCase.productIds.includes(p));

      req.addProductIds = addingProductIds;
      req.removeProductIds = removingProductIds;

      try {
        const caseId: CaseIdentity = {
          id: this.draftCase.id,
          sid: this.draftCase.sid,
          ownerOrgUuid: this.draftCase.ownerOrgUuid
        };
        await lastValueFrom(this.caseService.updateCase(caseId, req));

        // update assignees
        if (this.draftCase.assignees.length && (this.draftCase.assignees[0] !== assignee || !assignee)) {
          //remove old assignee
          await lastValueFrom(this.caseService.updateAssignee(caseId, 'remove', this.draftCase.assignees[0]));
        }
        if (assignee) {
          await lastValueFrom(this.caseService.updateAssignee(caseId, 'add', assignee));
        }

        // update relateTos
        const rls = relatedTos || [];

        const removingRelatedTos: { action: 'remove' | 'add'; sid: number; orgUuid: string }[] =
          this.draftCase.relatedCases
            .filter(p => !rls.some(rl => rl.sid === p.sid))
            .map(r => ({ action: 'remove', sid: r.sid, orgUuid: r.orgUuid }));
        const addingRelatedTos: { action: 'remove' | 'add'; sid: number; orgUuid: string }[] = rls
          .filter(r => !this.draftCase.relatedCases.some(rl => rl.sid === r.sid))
          .map(r => ({ action: 'add', sid: r.sid, orgUuid: r.orgUuid }));

        for (let i = 0; i < removingRelatedTos.length; i++) {
          await lastValueFrom(this.caseService.updateRelatedCases(caseId, removingRelatedTos[i]));
        }
        for (let i = 0; i < addingRelatedTos.length; i++) {
          await lastValueFrom(this.caseService.updateRelatedCases(caseId, addingRelatedTos[i]));
        }

        this.toastr.success('Create case successfully');
        LocalStorageUtil.removeItem(DRAFT_CASE_ID);
        this.goToHome();
      } catch (e) {
        this.toastr.error(e?.['message']);
      }
    }
    this.progressing = false;
  }

  goToHome() {
    this.router.navigate(['cases']);
  }

  trackByMember(_, user: User) {
    return user?.uuid;
  }

  tbRelatedCase(_, item: Case) {
    return item?.id;
  }

  private _initForm() {
    const selectedProductIds =
      this.draftCase?.productIds && this.caseMetadataQuery.getValue().productList
        ? this.caseMetadataQuery
            .getValue()
            .productList.filter(p => this.draftCase.productIds.includes(p.id))
            .map(p => p.id)
        : null;

    this.caseFG = this.fb.group({
      title: this.fb.control(this.draftCase?.title, Validators.required),
      typeId: this.fb.control(this.draftCase?.typeId || 1, Validators.required),
      productIds: this.fb.control(selectedProductIds, Validators.required),
      severityId: this.fb.control(this.draftCase?.severityId || 1, Validators.required),
      dueDate: this.fb.control(this.draftCase?.dueAt || null),
      relatedTos: this.fb.control(this.draftCase?.relatedCases || null),
      assignee: this.fb.control(this.draftCase?.assignees?.[0] || null),
      srcOrgUuid: this.fb.control(this.draftCase?.srcOrgUuid || Validators.required),
      ownerUuid: this.fb.control(this.draftCase?.ownerOrgUuid, Validators.required)
    });

    this.caseFG.get('typeId').valueChanges.subscribe(typeId => {
      if (typeId === 1) {
        this.caseFG.get('severityId').setValidators(Validators.required);
      } else {
        this.caseFG.get('severityId').removeValidators(Validators.required);
      }
      if ([1, 2].includes(typeId)) {
        this.caseFG.get('productIds').setValidators(Validators.required);
      } else {
        this.caseFG.get('productIds').removeValidators(Validators.required);
      }
      if ([1, 2, 5].includes(typeId)) {
        this.caseFG.get('srcOrgUuid').setValidators(Validators.required);
        this.searchOrgFC.setValidators(Validators.required);
      } else {
        this.caseFG.get('srcOrgUuid').removeValidators(Validators.required);
        this.searchOrgFC.removeValidators(Validators.required);
      }

      setTimeout(() => {
        this.changeDetectorRef.detectChanges();
      });
    });

    this.checkedOrgResult$ = this.searchOrgFC.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      mergeMap((value: string) => this.organizationService.checkOrgUuid(value).pipe(catchError(() => of(null)))),
      tap(r => {
        this.caseFG.get('srcOrgUuid').setValue(r ? this.searchOrgFC.value : null);
        console.log(this.caseFG.value);
      })
    );

    this.filteredMembers$ = this.searchMemberFC.valueChanges.pipe(
      debounceTime(300),
      startWith(''),
      switchMap(value => {
        let result;
        if (!value || value instanceof User) {
          result = this.userQuery.getAllUsers();
        } else {
          result = this.userQuery.getAllUsersContains(value);
        }
        return of(result);
      })
    );

    this.products$ = this.productFC.valueChanges.pipe(
      startWith(''),
      debounceTime(200),
      mergeMap((searchSTring: string) => {
        return this.caseMetadataQuery.productList$.pipe(
          filter(list => list != null),
          map(products => products.filter(p => p.name.toLocaleLowerCase().includes(searchSTring?.toLocaleLowerCase())))
        );
      })
    );

    this.relatedCases$ = this.searchCaseFC.valueChanges.pipe(
      startWith(''),
      distinctUntilChanged(),
      debounceTime(200),
      mergeMap(searchSTring => {
        console.log(searchSTring);

        const caseQueryReq: QueryCaseReq = {
          collaboratorRoles: [CollaboratorRole.owner],
          textSearch: searchSTring
        };
        return this.caseService.queryAllCases(caseQueryReq, { page: 1, perPage: 5 }, { ignoreUpdateStore: true }).pipe(
          catchError(() => of(null)),
          map(page => (!page ? [] : page.data)),
          tap(r => console.log(r))
        );
      })
    );
  }
}
