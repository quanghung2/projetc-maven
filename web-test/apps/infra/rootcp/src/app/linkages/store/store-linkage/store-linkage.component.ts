import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Partner, PartnersQuery, PartnersService } from '@b3networks/api/partner';
import { Linkage, LinkageService } from '@b3networks/api/store';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest } from 'rxjs';
import { debounceTime, filter, switchMap, takeUntil, tap } from 'rxjs/operators';

export interface StoreLinkageInput {
  linkage: Linkage;
  subLinkage: Linkage;
}

@Component({
  selector: 'b3n-store-linkage',
  templateUrl: './store-linkage.component.html',
  styleUrls: ['./store-linkage.component.scss']
})
export class StoreLinkageComponent extends DestroySubscriberComponent implements OnInit {
  types = [
    { key: 'CHANNEL', value: 'Channel' },
    { key: 'CUSTOMER', value: 'Customer' }
  ];
  form: UntypedFormGroup;
  supportedCurrencies: string[] = [];
  loading = true;
  saving: boolean;

  constructor(
    public dialogRef: MatDialogRef<StoreLinkageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StoreLinkageInput,
    private fb: UntypedFormBuilder,
    private partnersService: PartnersService,
    private partnersQuery: PartnersQuery,
    private linkageService: LinkageService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
  }

  fetchFormData(f: (partners: Partner[]) => void) {
    return this.partnersQuery.selectHasCache().pipe(
      takeUntil(this.destroySubscriber$),
      switchMap(hasCache => {
        return hasCache ? this.partnersQuery.partners$ : this.partnersService.getAllPartners();
      }),
      tap(f),
      tap(() => (this.loading = false))
    );
  }

  initForm() {
    this.form = this.fb.group({
      buyerUuid: ['', Validators.required],
      sellerUuid: ['', Validators.required],
      currency: ['', Validators.required],
      type: [null, Validators.required]
    });

    const currencyControl = this.form.controls['currency'];
    const buyerUuidControl = this.form.controls['buyerUuid'];
    const sellerUuidControl = this.form.controls['sellerUuid'];
    const typeControl = this.form.controls['type'];
    currencyControl.disable();

    combineLatest([buyerUuidControl.valueChanges, sellerUuidControl.valueChanges, typeControl.valueChanges])
      .pipe(
        takeUntil(this.destroySubscriber$),
        debounceTime(300),
        filter(value => !!value),
        tap(_ => {
          this.loading = true;
          this.supportedCurrencies = [];
        }),
        switchMap(() => {
          return this.partnersQuery.getHasCache()
            ? this.partnersQuery.partners$
            : this.partnersService.getAllPartners();
        }),
        tap(partners => {
          this.setSupportedCurrencies(partners);
          if (this.supportedCurrencies.length) {
            currencyControl.enable();
            currencyControl.setValue(this.supportedCurrencies[0]);
          } else currencyControl.disable();

          this.loading = false;
        })
      )
      .subscribe();

    typeControl.setValue(this.types[0].key);

    if (this.data.linkage) {
      const { buyerUuid, sellerUuid, defaultCurrency, type } = this.data.linkage;
      this.fetchFormData(partners => {
        this.setSupportedCurrencies(partners);
        if (!this.supportedCurrencies.length) this.supportedCurrencies = [defaultCurrency];

        this.form.patchValue({ buyerUuid, sellerUuid, currency: defaultCurrency, type });
        buyerUuidControl.disable();
        sellerUuidControl.disable();
        currencyControl.enable();
      }).subscribe();
    } else {
      const { buyerUuid, sellerUuid } = this.data.subLinkage;

      this.fetchFormData(partners => {
        this.setSupportedCurrencies(partners);
        this.supportedCurrencies.length ? currencyControl.enable() : currencyControl.disable();

        this.form.patchValue({
          buyerUuid,
          sellerUuid,
          currency: (this.supportedCurrencies || []).length ? this.supportedCurrencies[0] : null
        });
      }).subscribe();
    }
  }

  setSupportedCurrencies(partners: Partner[]) {
    const currencyControl = this.form.controls['currency'];
    const buyerUuidControl = this.form.controls['buyerUuid'];
    const sellerUuidControl = this.form.controls['sellerUuid'];
    const typeControl = this.form.controls['type'];

    const buyerPartner: Partner = partners.find(p => p.partnerUuid === buyerUuidControl.value);
    const sellerPartner: Partner = partners.find(p => p.partnerUuid === sellerUuidControl.value);
    const isCustomer: boolean = typeControl.value === this.types[1].key;

    if (isCustomer ? !sellerPartner : !buyerPartner || !sellerPartner) {
      this.loading = false;
      currencyControl.disable;
      return;
    }

    if (isCustomer) {
      this.supportedCurrencies = sellerPartner.supportedCurrencies || [];
    } else {
      this.supportedCurrencies =
        buyerPartner && sellerPartner
          ? (buyerPartner.supportedCurrencies || []).filter(buyerCurrency =>
              (sellerPartner.supportedCurrencies || []).includes(buyerCurrency)
            )
          : [];
    }
  }

  storeLinkage() {
    this.saving = true;

    const obs = this.data.linkage
      ? this.linkageService.updateLinkage(this.form.getRawValue())
      : this.linkageService.createLinkage(this.form.value);

    obs
      .subscribe(
        linkage => {
          this.toastService.success(`${this.data.linkage ? 'Update' : 'Create'} linkage successfully`);
          this.dialogRef.close(this.data.linkage ? linkage : null);
        },
        err => this.toastService.warning(err.message)
      )
      .add(() => (this.saving = false));
  }

  get currency() {
    return this.form.controls['currency'];
  }
}
