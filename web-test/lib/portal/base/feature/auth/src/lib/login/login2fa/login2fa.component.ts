import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import {
  Login2FaRequest,
  LoginRequest,
  LoginResponse,
  TfaService,
  Verify2FaRequest,
  Verify2FaResponse,
  Verify2FaType
} from '@b3networks/api/auth';
import { PortalConfig } from '@b3networks/api/partner';
import { SessionService } from '@b3networks/portal/base/shared';
import { MessageConstants } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'pba-login2fa',
  templateUrl: './login2fa.component.html',
  styleUrls: ['./login2fa.component.scss']
})
export class Login2faComponent implements OnInit {
  @Input() config: PortalConfig;
  @Input() loginForm: UntypedFormGroup;
  @Input() loginResponse: LoginResponse;

  @Output() resetLogin = new EventEmitter();
  @Output() completedLogin = new EventEmitter<boolean>();

  typeLogin2FA: string;
  login2FAForm: UntypedFormGroup;
  indicator = false;
  reLoginIndicator = false;
  error: string;
  showErrorSummary = false;

  get otpCode(): UntypedFormControl {
    return this.login2FAForm.get('otpCodeView') as UntypedFormControl;
  }
  getErrorOtpCode() {
    return this.otpCode.hasError('required') ? 'Please enter your verification code' : '';
  }

  get recoveryKey(): UntypedFormControl {
    return this.login2FAForm.get('recoveryKey') as UntypedFormControl;
  }
  getErrorRecoveryKey() {
    return this.recoveryKey.hasError('required') ? 'Please enter your recovery key' : '';
  }

  constructor(
    private fb: UntypedFormBuilder,
    private toastr: ToastService,
    private tfaService: TfaService,
    private sessionService: SessionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.login2FAForm = this.fb.group({
      domain: [''],
      otpCode: [null],
      otpCodeView: [''],
      otpId: [''],
      recoveryKey: [null],
      type: [''],
      trustBrowser: [false]
    });

    this.typeLogin2FA = this.loginResponse.type;
    this.cdr.detectChanges();
  }

  sensitiveEmail() {
    if (this.loginResponse.email) {
      const index = this.loginResponse.email.indexOf('@');
      if (index > 2) {
        const substring = this.loginResponse.email.substring(index - 2, this.loginResponse.email.length);
        return '*****' + substring;
      }
    }
    return '';
  }

  relogin() {
    this.reLoginIndicator = true;
    this.sessionService.login(<LoginRequest>this.loginForm.value).subscribe(
      response => {
        this.reLoginIndicator = false;
        if (response.otpId && response.sanitizedCode) {
          response.type = response.type.toLowerCase();
          this.loginResponse = response;
          this.typeLogin2FA = this.loginResponse.type;
        }
      },
      error => {
        this.reLoginIndicator = false;
        if (error.code) {
          if (error.code === 'auth.OtpAttemptsExceeded') {
            this.resetLogin.emit();
          }
        }
      }
    );
  }

  switchTypeSignIn() {
    if (this.typeLogin2FA === Verify2FaType.recover) this.typeLogin2FA = this.loginResponse.type;
    else this.typeLogin2FA = Verify2FaType.recover;
    this.cdr.detectChanges();

    this.otpCode.setValue(null);
    this.otpCode.setErrors(null);
    this.otpCode.reset();
    this.otpCode.markAsPristine();
    this.otpCode.markAsUntouched();

    this.recoveryKey.setValue(null);
    this.recoveryKey.setErrors(null);
    this.recoveryKey.reset();
    this.recoveryKey.markAsPristine();
    this.recoveryKey.markAsUntouched();

    this.error = '';
    this.showErrorSummary = false;
  }

  verifyLogin2FA() {
    this.otpCode.setErrors(null);
    this.recoveryKey.setErrors(null);

    switch (this.typeLogin2FA) {
      case Verify2FaType.system:
        if (!this.otpCode.value) this.otpCode.setErrors({ required: true });
        else {
          this.otpCode.setErrors(null);
          this.login2FAForm.patchValue({
            otpCode: `${this.loginResponse.sanitizedCode}-${this.otpCode.value}`,
            recoveryKey: null
          });
        }
        break;
      case Verify2FaType.totp:
        if (!this.otpCode.value) this.otpCode.setErrors({ required: true });
        else {
          this.otpCode.setErrors(null);
          this.login2FAForm.patchValue({
            otpCode: this.otpCode.value,
            recoveryKey: null
          });
        }
        break;
      case Verify2FaType.recover:
        if (!this.recoveryKey.value) this.recoveryKey.setErrors({ required: true });
        else {
          this.recoveryKey.setErrors(null);
          this.login2FAForm.patchValue({
            otpCode: null
          });
          break;
        }
    }

    this.login2FAForm.patchValue({
      domain: this.loginResponse.domain,
      otpId: this.loginResponse.otpId,
      type: this.typeLogin2FA
    });

    const data = new Verify2FaRequest({
      domain: this.loginResponse.domain,
      otpId: this.loginResponse.otpId,
      otpCode: this.login2FAForm.get('otpCode').value,
      recoveryKey: this.recoveryKey.value,
      type: this.typeLogin2FA
    });

    this.indicator = true;
    this.tfaService.verify2Fa(<Verify2FaRequest>data).subscribe(
      (response: Verify2FaResponse) => {
        this.sessionService
          .complete2faLogin(<Login2FaRequest>{
            loginSession: this.loginResponse.loginSession,
            tfaSession: response.tfaSession,
            trustBrowser: this.login2FAForm.get('trustBrowser').value
          })
          .subscribe(
            res => {
              if (!res.needVerifyOPT && !res.need2UpdateEmailFirst) {
                this.completedLogin.emit(true);
              }
            },
            error => {
              this.indicator = false;
              if (error.code === 'auth.LoginSessionExpired') {
                this.toastr.warning('Session expired. Please sign in again.');
                this.resetLogin.emit();
              } else {
                this.error = MessageConstants.GENERAL_ERROR;
              }
              this.showErrorSummary = true;
            }
          );
      },
      errResp => {
        this.indicator = false;
        const error = errResp.error;
        if (this.typeLogin2FA !== Verify2FaType.recover) {
          if (error.code === 'auth.OtpCodeInvalid') {
            this.error = 'The verification code provided is incorrect';
          } else if (error.code === 'auth.OtpExpired' || error.code === 'OtpFlowDurationExpiredException') {
            this.error = 'The provided code has expired';
          } else if (error.code === 'auth.OtpSessionNotFound') {
            this.toastr.warning(`OTP session expired. Please sign in again.`);
            this.resetLogin.emit();
          } else {
            this.error = MessageConstants.GENERAL_ERROR;
          }
        } else {
          this.error = 'Invalid code';
        }
        this.showErrorSummary = true;
      }
    );
  }
}
