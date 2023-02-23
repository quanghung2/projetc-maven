import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IdentityProfile, IdentityProfileService, Organization, OrganizationService } from '@b3networks/api/auth';
import { Product } from '@b3networks/api/store';
import { DomainUtilsService, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';

export interface ContactSalesInput {
  product: Product;
}

@Component({
  selector: 'store-contact-sales',
  templateUrl: './contact-sales.component.html',
  styleUrls: ['./contact-sales.component.scss']
})
export class ContactSalesComponent implements OnInit {
  @ViewChild('contactForm') contactForm: NgForm;

  model = {
    customer: {
      name: null,
      company: null,
      email: null,
      mobileNumber: null,
      domain: null
    },
    message: 'Hi, I would like to know more about this product. Glad to discuss with you as soon as possible.'
  };
  submitting: Boolean = false;
  identity: IdentityProfile;
  user: Organization;
  honeyPotsCheck: any;

  private reason = 'Need your help. I have no account';

  constructor(
    public dialogRef: MatDialogRef<ContactSalesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ContactSalesInput,
    private http: HttpClient,
    private orgService: OrganizationService,
    private profileService: IdentityProfileService,
    private messageService: ToastService,
    private domain: DomainUtilsService
  ) {}

  ngOnInit() {
    forkJoin([this.profileService.getProfile(), this.orgService.getOrganizationByUuid(X.orgUuid)]).subscribe(data => {
      this.identity = data[0];
      this.user = data[1];
      this.initData();
    });
  }

  private initData() {
    this.model = {
      customer: {
        name: null,
        company: null,
        email: null,
        mobileNumber: null,
        domain: this.domain.getPortalDomain()
      },
      message: 'Hi, I would like to know more about this product. Glad to discuss with you as soon as possible.'
    };
    if (this.identity) {
      this.model.customer.name = this.identity.displayName;
      this.model.customer.email = this.identity.email;
      this.model.customer.mobileNumber = this.identity.mobileNumber;
    }
    if (this.user) {
      this.model.customer.company = this.user.name;
    }
  }

  onSubmit() {
    this.submitting = true;

    if (this.honeyPotsCheck) {
      this.submitting = false;
      return;
    }

    const body = {
      domain: this.domain.getPortalDomain(),
      customerUuid: this.user ? this.user.uuid : '',
      productSku: this.data.product.productId,
      productType: this.data.product.type,
      customer: this.model.customer,
      message: this.generateMessage()
    };
    this.http.post(`sales/private/v1/contact-sales`, body).subscribe(
      res => {
        this.messageService.success('Thank you, We will contact you shortly');
        this.submitting = false;
        this.dialogRef.close();
      },
      error => {
        this.messageService.warning(error.message);
        this.submitting = false;
      }
    );
  }

  private generateMessage() {
    let requestInfo = `Reason: ${this.reason}`;
    if (this.data.product) {
      requestInfo = `
      Product SKU: ${this.data.product.productId}
      Product Name: ${this.data.product.name}
      Product Type: ${this.data.product.type}
      Product URI: ${window.location}
      `;
    }

    return `
    Hi Sales team,

    A customer contacts us with the following information:

      ${requestInfo}

      Name: ${this.model.customer.name}
      Company Name: ${this.model.customer.company}
      Email Address: ${this.model.customer.email}
      Contact Number: ${this.model.customer.mobileNumber}
      Domain: ${this.model.customer.domain}

      Message: ${this.model.message}

    ====================
    Powered by B3Networks Store Team.
    `;
  }
}
