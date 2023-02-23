import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthenticationService,
  CreateNewPasswordRequest,
  RealDomainService,
  ResetPasswordType,
  VerifyEmail
} from '@b3networks/api/auth';
import { PortalConfig, PortalConfigQuery } from '@b3networks/api/partner';
import { DomainUtilsService, encrypt, MessageConstants } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';

@Component({
  selector: 'pba-create-new-password',
  templateUrl: './create-new-password.component.html',
  styleUrls: ['./create-new-password.component.scss']
})
export class CreateNewPasswordComponent implements OnInit {
  @ViewChild('newPasswordInput') newPasswordInput: ElementRef;

  config$: Observable<PortalConfig>;
  createNewPassForm: UntypedFormGroup;
  indicator = false;
  showPassword = false;
  showErrorSummary = false;
  error: string;
  activationToken: string;
  enableLoginWithMs: boolean;
  enableSetPassword = false;

  get password(): UntypedFormControl {
    return this.createNewPassForm.get('password') as UntypedFormControl;
  }
  getErrorPassword() {
    return this.password.hasError('required') ? 'Please enter your password' : '';
  }

  constructor(
    private fb: UntypedFormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastr: ToastService,
    private realDomainService: RealDomainService,
    private authenticationService: AuthenticationService,
    private portalConfigQuery: PortalConfigQuery,
    private domainUtilsService: DomainUtilsService
  ) {
    this.realDomainService.getRealDomainFromPortalDomain().subscribe(resp => {
      this.enableLoginWithMs = resp.ssoIdPs && resp.ssoIdPs.includes('microsoft');
    });
  }

  ngOnInit(): void {
    this.config$ = this.portalConfigQuery.portalConfig$;

    this.createNewPassForm = this.fb.group({
      domain: [this.domainUtilsService.getPortalDomain()],
      password: ['', Validators.required],
      token: [''],
      type: ['']
    });

    this.activatedRoute.queryParams.subscribe(params => {
      if (params['email'] && params['token'] && params['type']) {
        switch (params['type']) {
          case ResetPasswordType.activate:
            this.activationToken = params['token'];
            break;
          case ResetPasswordType.verify:
            this.authenticationService
              .verifyEmail(new VerifyEmail({ token: params['token'], email: params['email'] }))
              .subscribe(
                () => {},
                error => {
                  const code = error.code;
                  if (code && code.indexOf('PasswordResetNotFound') > -1) {
                    this.toastr.error(
                      'Given PasswordReset token does not exist. Please trigger the password verify service again'
                    );
                  } else if (code && code.indexOf('EmailVerificationTokenHasBeenClaimed') > -1) {
                    this.toastr.error(
                      'Given EmailVerification token has been claimed. Please trigger the password verify service again'
                    );
                  } else if (code && code.indexOf('TokenExpired') > -1) {
                    this.toastr.error('Your token has been expired. Please trigger the password verify service again');
                  } else {
                    this.toastr.error(MessageConstants.GENERAL_ERROR);
                  }
                  this.router.navigate(['auth', 'login']);
                }
              );
            break;
          case ResetPasswordType.reset:
            this.authenticationService.verifyResetPassword(params['token'], params['email']).subscribe(
              () => {},
              error => {
                const code = error.code;
                if (code && code.indexOf('PasswordResetNotFound') > -1) {
                  this.toastr.error(
                    'Given PasswordReset token does not exist. Please trigger the password reset service again'
                  );
                } else if (code && code.indexOf('EmailVerificationTokenHasBeenClaimed') > -1) {
                  this.toastr.error(
                    'Given EmailVerification token has been claimed. Please trigger the password reset service again'
                  );
                } else if (code && code.indexOf('TokenExpired') > -1) {
                  this.toastr.error('Your token has been expired. Please trigger the password reset service again');
                } else {
                  this.toastr.error(MessageConstants.GENERAL_ERROR);
                }
                this.router.navigate(['auth', 'login']);
              }
            );
            break;
        }

        this.createNewPassForm.patchValue({
          token: params['token'],
          type: params['type']
        });
      } else {
        this.router.navigate(['auth', 'resetpassword']);
      }
    });
  }

  setNewPassword() {
    if (this.createNewPassForm.valid && !this.indicator) {
      this.indicator = true;
      this.realDomainService.getRealDomainFromPortalDomain().subscribe(async realDomain => {
        const req = <CreateNewPasswordRequest>this.createNewPassForm.value;
        if (realDomain.publicKey) {
          req.password = await encrypt(req.password, realDomain.publicKey);
        }
        this.authenticationService.createNewPassword(req).subscribe(
          () => {
            this.indicator = false;
            this.toastr.success('Your password has been changed successfully. Please sign in again.');
            this.router.navigate(['auth', 'login']);
          },
          error => {
            this.indicator = false;
            if (error instanceof HttpErrorResponse) {
              error = error.error;
            }

            if (error.code === 'auth.violatedSecurityPolicy.password_not_compliant') {
              this.error = error.message;
            } else if (error.code === 'auth.violatedSecurityPolicy.password_reuse_not_allowed') {
              this.error = 'Password cannot be the same as previous passwords.';
            } else {
              this.error = error.message;
            }
            this.showErrorSummary = true;
          }
        );
      });
    }
  }

  showSetPasswordSection() {
    this.enableSetPassword = true;
    setTimeout(() => {
      this.newPasswordInput.nativeElement.focus();
    });
  }
}
