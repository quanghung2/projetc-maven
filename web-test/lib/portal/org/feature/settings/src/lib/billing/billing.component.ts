import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import {
  AuthenticationService,
  BillingInfo,
  Country,
  CountryQuery,
  EmailBilling,
  OrganizationQuery,
  OrganizationService,
  UnverifiedEmails,
  UpdateCompanyRequest,
  VerifyEmail
} from '@b3networks/api/auth';
import { DomainUtilsService, MessageConstants, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

@Component({
  selector: 'pos-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss']
})
export class BillingComponent implements OnInit {
  billingInfo: BillingInfo;
  billingInfoForm: UntypedFormGroup;
  updating = false;
  adding = false;

  countries: Country[] = [];
  filteredCountries: Country[] = [];
  countryCtrl = new UntypedFormControl();
  countryFilterCtrl = new UntypedFormControl();

  emailVerified: EmailBilling[] = [];
  emailUnVerified: EmailBilling[] = [];
  newEmail = new UntypedFormControl();

  get countryCode(): UntypedFormControl {
    return this.billingInfoForm.get('countryCode') as UntypedFormControl;
  }

  constructor(
    private fb: UntypedFormBuilder,
    private toastr: ToastService,
    private countryQuery: CountryQuery,
    private organizationQuery: OrganizationQuery,
    private organizationService: OrganizationService,
    private authenticationService: AuthenticationService,
    private domainUtilsService: DomainUtilsService
  ) {}

  ngOnInit(): void {
    combineLatest([this.organizationQuery.selectOrganization(X.orgUuid), this.countryQuery.selectAll()])
      .pipe(
        map(([org, countries]) => {
          this.billingInfo = org.billingInfo;
          this.countries = countries;
          this.filteredCountries = this.countries;

          this.billingInfoForm = this.fb.group({
            billingName: [this.billingInfo.billingName],
            addressLineOne: [this.billingInfo.addressLineOne],
            addressLineTwo: [this.billingInfo.addressLineTwo],
            city: [this.billingInfo.city],
            countryCode: [this.billingInfo.countryCode],
            state: [this.billingInfo.state],
            zip: [this.billingInfo.zip]
          });

          const country = this.countries.find(c => c.code === this.billingInfo.countryCode);
          this.countryCtrl.setValue(country ? country : <Country>{ code: '', name: 'Unavailable' });

          this.convertEmail();
          this.newEmail.setValidators(Validators.compose([Validators.required, Validators.email]));
        })
      )
      .subscribe();

    this.countryFilterCtrl.valueChanges.subscribe((val: string) => {
      this.filteredCountries = this.countries.filter(t => t.name.toLowerCase().indexOf(val.toLowerCase()) >= 0);
    });

    this.countryCtrl.valueChanges.subscribe((val: Country) => {
      this.countryCode.setValue(val.code);
    });
  }

  compareCountry(ct1: Country, ct2: Country): boolean {
    return !ct1 || !ct2 ? false : ct1.code === ct2.code;
  }

  update() {
    this.updating = true;
    this.organizationService
      .updateCompanyInfo(<UpdateCompanyRequest>{
        billingInfo: Object.assign({}, this.billingInfo, this.billingInfoForm.value),
        orgUuid: X.orgUuid
      })
      .pipe(finalize(() => (this.updating = false)))
      .subscribe(
        _ => {
          this.toastr.success(`Your organization's billing address has been updated.`);
        },
        error => {
          if ('org.InsufficientPrivilege' === error.code) {
            this.toastr.warning(`You don't have sufficient privileges to perform this action`);
          } else {
            this.toastr.warning(MessageConstants.GENERAL_ERROR);
          }
        }
      );
  }

  private convertEmailVerifyToModel(emails: string[]): EmailBilling[] {
    return emails.map(e => {
      return new EmailBilling({ email: e });
    });
  }

  private convertEmailUnVerifyToModel(emails: UnverifiedEmails[]): EmailBilling[] {
    return emails.map(e => {
      return new EmailBilling({ email: e.email, token: e.token });
    });
  }

  private convertEmail() {
    this.emailVerified = this.convertEmailVerifyToModel(this.billingInfo.emails);
    this.emailUnVerified = this.convertEmailUnVerifyToModel(this.billingInfo.unverifiedEmails);
  }

  removeEmail(e: EmailBilling) {
    e.loading = true;
    if (e.token) {
      this.authenticationService
        .deleteEmailToken(<VerifyEmail>{
          email: e.email,
          token: e.token,
          domain: this.domainUtilsService.getPortalDomain()
        })
        .pipe(finalize(() => (e.loading = false)))
        .subscribe(
          _ => {
            this.toastr.success(`Your email address ${e.email} has been deleted.`);
            this.billingInfo.unverifiedEmails = this.billingInfo.unverifiedEmails.filter(i => i.email != e.email);
            this.organizationService.updateBillingInfo(this.billingInfo);
            this.emailUnVerified = this.convertEmailUnVerifyToModel(this.billingInfo.unverifiedEmails);
          },
          _ => {
            this.toastr.error(MessageConstants.GENERAL_ERROR);
          }
        );
    } else {
      this.authenticationService
        .deleteEmail(<VerifyEmail>{ email: e.email, domain: this.domainUtilsService.getPortalDomain() })
        .pipe(finalize(() => (e.loading = false)))
        .subscribe(
          _ => {
            this.toastr.success(`Your email address ${e.email} has been deleted.`);
            this.billingInfo.emails = this.billingInfo.emails.filter(i => i !== e.email);
            this.organizationService.updateBillingInfo(this.billingInfo);
            this.emailVerified = this.convertEmailVerifyToModel(this.billingInfo.emails);
          },
          _ => {
            this.toastr.error(MessageConstants.GENERAL_ERROR);
          }
        );
    }
  }

  resentEmail(e: EmailBilling) {
    e.loading = true;
    this.authenticationService
      .resendEmailToken(<VerifyEmail>{ email: e.email, token: e.token })
      .pipe(finalize(() => (e.loading = false)))
      .subscribe(
        _ => {
          this.toastr.success(`You have sent a confirmation email to ${e.email}.`);
        },
        _ => {
          this.toastr.error(MessageConstants.GENERAL_ERROR);
        }
      );
  }

  getErrorNewEmail() {
    if (this.newEmail.hasError('required')) return "Email can't be empty";
    else if (this.newEmail.hasError('pattern')) return 'Email is invalid';
    return '';
  }

  addEmail() {
    if (this.newEmail.valid) {
      this.adding = true;
      this.organizationService
        .updateCompanyInfo(<UpdateCompanyRequest>{
          billingInfo: { billingEmail: this.newEmail.value },
          orgUuid: X.orgUuid
        })
        .pipe(finalize(() => (this.adding = false)))
        .subscribe(
          _ => {
            this.toastr.success(`Your organization's billing email has been added.`);
            this.newEmail.reset();
          },
          error => {
            if ('org.InsufficientPrivilege' === error.code) {
              this.toastr.warning(`You don't have sufficient privileges to perform this action`);
            } else {
              this.toastr.warning(MessageConstants.GENERAL_ERROR);
            }
          }
        );
    }
  }
}
