import { KeyValue } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatOption } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Product } from '@b3networks/api/store';
import { ExportSubscriptionReq, SubscriptionService } from '@b3networks/api/subscription';

export interface ExportSubscriptionInput {
  email: string;
  domain: string;
  products: Product[];
}
@Component({
  selector: 'b3n-export-subscription-modal',
  templateUrl: './export-subscription-modal.component.html',
  styleUrls: ['./export-subscription-modal.component.scss']
})
export class ExportSubscriptionModalComponent implements OnInit {
  readonly status: KeyValue<string, string>[] = [
    { key: 'ACTIVE', value: 'Active' },
    { key: 'EXPIRED', value: 'Expired' }
  ];

  formGroup: UntypedFormGroup;
  domain: string;
  distributingProducts: Product[] = [];

  @ViewChild('allSelected') private allSelected: MatOption;

  get statusSubscription() {
    return this.formGroup.get('statusSubscription');
  }

  get emails(): UntypedFormArray {
    return this.formGroup.get('emails') as UntypedFormArray;
  }

  get product() {
    return this.formGroup.get('product');
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: ExportSubscriptionInput,
    private fb: UntypedFormBuilder,
    private subscriptionService: SubscriptionService,
    private dialogRef: MatDialogRef<ExportSubscriptionModalComponent>
  ) {
    this.iniFormData();
  }

  ngOnInit(): void {
    this.domain = this.data.domain;
    this.distributingProducts = this.data.products;
  }

  exportSubscription() {
    if (this.isError()) {
      return;
    }
    const emails = this.emails.value.map(item => item.email);
    const productIds = this.product.value.length ? this.product.value?.filter(item => item !== 'All') : [];
    const keys = this.status.map(item => item.key);

    const statuses = this.statusSubscription.value === 'ALL' ? keys.join(',') : this.statusSubscription.value;

    const request: ExportSubscriptionReq = {
      emails: emails,
      productIds: productIds,
      statuses: statuses
    };
    this.subscriptionService.exportSubscription(this.domain, request).subscribe();
    this.dialogRef.close();
  }

  isError() {
    const lengthControl = this.emails.controls.length;
    const controls = this.emails.controls;

    for (let i = 0; i < lengthControl; i++) {
      controls[i].get('email').markAsTouched();
      if (controls[i].get('email').hasError('required') || controls[i].get('email').hasError('email')) {
        return true;
      }
    }

    return false;
  }

  addEmail() {
    const controls = new UntypedFormGroup({
      email: new UntypedFormControl('', [Validators.required, Validators.email])
    });
    this.emails.push(controls);
  }

  removeEmail(index: number) {
    this.emails.removeAt(index);
  }

  iniFormData() {
    this.formGroup = this.fb.group({
      emails: this.fb.array([
        this.fb.group({
          email: new UntypedFormControl(this.data.email, [Validators.required, Validators.email])
        })
      ]),
      statusSubscription: [this.status[0]['key']],
      product: ['']
    });
  }

  getErrorNewEmail(email) {
    if (email.hasError('required')) return "Email can't be empty";
    else if (email.hasError('email')) return 'Email is invalid';
    return '';
  }

  tosslePerOne() {
    if (this.allSelected.selected) {
      this.allSelected.deselect();
      return;
    }
    if (this.product.value.length === this.distributingProducts.length) {
      this.allSelected.select();
    }
  }

  selectedAll() {
    if (this.allSelected.selected) {
      this.product.patchValue([...this.distributingProducts.map(item => item.productId), 'All']);
    } else {
      this.product.patchValue([]);
    }
  }
}
