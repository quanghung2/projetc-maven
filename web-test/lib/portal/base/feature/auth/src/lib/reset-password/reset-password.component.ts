import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { AuthenticationService, ResetPasswordRequest } from '@b3networks/api/auth';
import { PortalConfig, PortalConfigQuery } from '@b3networks/api/partner';
import { DomainUtilsService, MessageConstants } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';

@Component({
  selector: 'pba-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  config$: Observable<PortalConfig>;
  resetPassForm: UntypedFormGroup;
  indicator = false;

  get email(): UntypedFormControl {
    return this.resetPassForm.get('email') as UntypedFormControl;
  }

  getErrorEmail() {
    if (this.email.hasError('required')) return 'Please enter your email';
    else if (this.email.hasError('pattern')) return 'Email is invalid';
    else return '';
  }

  constructor(
    private fb: UntypedFormBuilder,
    private toastr: ToastService,
    private authenticationService: AuthenticationService,
    private portalConfigQuery: PortalConfigQuery,
    private domainUtilsService: DomainUtilsService
  ) {}

  ngOnInit(): void {
    this.config$ = this.portalConfigQuery.portalConfig$;

    this.resetPassForm = this.fb.group({
      domain: [this.domainUtilsService.getPortalDomain()],
      email: ['', Validators.compose([Validators.required, Validators.email])]
    });
  }

  reset() {
    if (this.resetPassForm.valid && !this.indicator) {
      this.indicator = true;
      this.authenticationService.createEmailToken(<ResetPasswordRequest>this.resetPassForm.value).subscribe(
        () => {
          this.indicator = false;
          this.toastr.success(
            'An email containing password reset instructions has been sent to your email. Please check and follow the instructions.'
          );
        },
        () => {
          this.indicator = false;
          this.toastr.error(MessageConstants.GENERAL_ERROR);
        }
      );
    }
  }

  removeReadonlyAttr(input: HTMLInputElement) {
    input.removeAttribute('readonly');
  }
}
