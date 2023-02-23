import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Organization, OrganizationQuery, OrganizationService, QueryOrgReq } from '@b3networks/api/auth';
import {
  CaseRouting,
  CaseRoutingService,
  CreateUpdateRoutingRuleReq,
  Inbox,
  InboxesQuery
} from '@b3networks/api/inbox';
import { MetaData, SCMetaDataQuery } from '@b3networks/api/workspace';
import { B3_ORG_UUID, MyErrorStateMatcher, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { catchError, debounceTime, finalize, map, mergeMap, Observable, of, startWith, switchMap } from 'rxjs';
import { StoreInboxComponent } from '../../inbox-list/store-inbox/store-inbox.component';

export interface StoreRoutingConfigData {
  isCreate: boolean;
  routing: CaseRouting;
}

@Component({
  selector: 'b3n-store-routing-config',
  templateUrl: './store-routing-config.component.html',
  styleUrls: ['./store-routing-config.component.scss']
})
export class StoreRoutingConfigComponent implements OnInit {
  @ViewChild('orgInput') orgInput: ElementRef<HTMLInputElement>;
  @ViewChild('domainInput') domainInput: ElementRef<HTMLInputElement>;

  isB3: boolean;
  loading = true;
  isProcessing: boolean;
  matcher = new MyErrorStateMatcher();
  group = this.fb.group({
    inbox: ['', [Validators.required]],
    type: 'All',
    products: [['All']],
    orgs: [[]],
    domains: [[]]
  });

  filteredInbox$: Observable<Inbox[]>;

  filteredProduct$: Observable<MetaData[]>;
  productCtrl = new UntypedFormControl();

  filteredType$: Observable<MetaData[]>;

  filteredOrgs$: Observable<Organization[]>;
  orgCtrl = new UntypedFormControl();
  domainCtrl = new UntypedFormControl();

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  get products() {
    return this.group.get('products');
  }

  get orgs() {
    return this.group.get('orgs');
  }

  get domains() {
    return this.group.get('domains');
  }

  get isAllProduct() {
    return this.products.value?.indexOf('All') > -1;
  }

  get displayProduct() {
    return this.isAllProduct ? 'All (*)' : (this.products.value?.map(x => x.name)?.join(', ') as string);
  }

  constructor(
    public dialogRef: MatDialogRef<StoreInboxComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StoreRoutingConfigData,
    private fb: UntypedFormBuilder,
    private inboxesQuery: InboxesQuery,
    private caseRoutingService: CaseRoutingService,
    private toastService: ToastService,
    private caseMetadataQuery: SCMetaDataQuery,
    private organizationService: OrganizationService,
    private organizationQuery: OrganizationQuery
  ) {}

  ngOnInit() {
    this.isB3 = X.orgUuid === B3_ORG_UUID;

    this.filteredInbox$ = this.inboxesQuery.selectAll();
    this.filteredType$ = this.caseMetadataQuery.typeList$;

    this.filteredProduct$ = this.productCtrl.valueChanges.pipe(
      startWith(''),
      debounceTime(200),
      mergeMap((searchSTring: string) => {
        return this.caseMetadataQuery.productList$.pipe(
          map(products => products?.filter(p => p.name.toLocaleLowerCase().includes(searchSTring?.toLocaleLowerCase())))
        );
      })
    );

    this.filteredOrgs$ = this.orgCtrl.valueChanges.pipe(
      startWith(null),
      debounceTime(300),
      switchMap((text: string | Organization) => {
        if (typeof text === 'string') {
          return this.organizationService.queryOrgs(
            <QueryOrgReq>{
              keyword: text?.trim()?.toLowerCase()
            },
            { page: 0, perPage: 20 }
          );
        }
        return this.organizationService.queryOrgs(
          <QueryOrgReq>{
            keyword: ''
          },
          { page: 0, perPage: 20 }
        );
      }),
      catchError(err => of(<Organization[]>[])),
      map(orgs => orgs?.filter(x => !(this.orgs.value as Organization[])?.some(o => o.uuid === x.uuid)))
    );

    if (!this.data.isCreate) {
      const data = this.data.routing;
      const type = data.typeIds.indexOf('*') > -1 || data.typeIds?.length === 0 ? 'All' : +data.typeIds?.[0];
      const products =
        data.productIds.indexOf('*') > -1 || data.productIds?.length === 0
          ? ['All']
          : data.productIds?.map(x => this.caseMetadataQuery.getProductById(+x)).filter(x => !!x);
      const orgs =
        data.sourceOrgUuids?.indexOf('*') > -1
          ? []
          : data.sourceOrgUuids?.map(x => this.organizationQuery.getEntity(x))?.filter(x => !!x);
      const domains = data.sourceDomainUuids?.indexOf('*') > -1 ? [] : data.sourceDomainUuids;

      this.group.setValue({
        inbox: data.inboxUuid,
        type: type,
        products: products,
        orgs: orgs,
        domains: domains
      });
    }
    this.loading = false;
  }

  selectedOrg(event: MatAutocompleteSelectedEvent) {
    this.orgs.setValue([...this.orgs.value, event.option.value as Organization]);
    this.orgInput.nativeElement.value = '';
    this.orgCtrl.setValue(null);
  }

  removeOrg(org: Organization): void {
    const index = (this.orgs.value as Organization[])?.findIndex(x => x.uuid === org.uuid);

    if (index >= 0) {
      const arr = [...this.orgs.value];
      arr.splice(index, 1);
      this.orgs.setValue(arr);
      this.orgs.updateValueAndValidity();
    }
  }

  removeDomain(domain: string) {
    const index = this.domains.value.indexOf(domain);

    if (index >= 0) {
      const arr = [...this.domains.value];
      arr.splice(index, 1);
      this.domains.setValue(arr);
      this.domains.updateValueAndValidity();
    }
  }

  addDomain($event: MatChipInputEvent) {
    const domain = ($event.value || '').trim();
    if (domain) {
      this.domains.setValue([...this.domains.value, domain]);
      this.domainInput.nativeElement.value = '';
    }
  }

  onSave() {
    const req = <CreateUpdateRoutingRuleReq>{
      typeIds:
        !this.group.get('type').value || this.group.get('type').value === 'All'
          ? ['*']
          : [this.group.get('type').value?.toString()],
      productIds:
        !this.products.value || this.products.value?.length === 0 || this.products.value?.indexOf('All') > -1
          ? ['*']
          : (this.products.value as MetaData[])?.map(x => x.id.toString()),
      sourceOrgUuids:
        !this.orgs.value || this.orgs.value?.length === 0
          ? ['*']
          : (this.orgs.value as Organization[])?.map(x => x.uuid),
      sourceDomainUuids: !this.domains.value || this.domains.value?.length === 0 ? ['*'] : this.domains.value,
      inboxUuid: this.group.get('inbox').value
    };
    if (this.data.isCreate) {
      this.isProcessing = true;
      this.caseRoutingService
        .createRouting(req)
        .pipe(finalize(() => (this.isProcessing = false)))
        .subscribe(
          routing => {
            this.dialogRef.close(routing);
            this.toastService.success(`Create successfully`);
          },
          err => this.toastService.error(err?.message)
        );
    } else {
      this.isProcessing = true;
      this.caseRoutingService
        .updateRouting(this.data.routing.id, req)
        .pipe(finalize(() => (this.isProcessing = false)))
        .subscribe(
          routing => {
            this.dialogRef.close(routing);
            this.toastService.success(`Update successfully`);
          },
          err => this.toastService.error(err?.message)
        );
    }
  }
}
