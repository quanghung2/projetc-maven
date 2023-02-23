import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import {
  RefreshRecoveryKeyResponse,
  SendOtpCodeRequest,
  SendOtpCodeResponse,
  TfaInfo,
  TFAIntentType,
  TfaService,
  Toggle2FaRequest,
  Toggle2FaResponse,
  Verify2FaRequest,
  Verify2FaResponse,
  Verify2FaType
} from '@b3networks/api/auth';
import { MessageConstants } from '@b3networks/shared/common';
import { ModalService } from '../../../../shared/modal/modal.service';
import { TwoFaActionType } from '../../security.model';

class Error {
  code: string;
  serverError: string;

  hasError() {
    return this.code || this.serverError;
  }
}

interface LoadingButtonOptions {
  text: string;
  loading: boolean;
  disabled: boolean;
}
@Component({
  selector: 'b3n-twofa-verifyEmail',
  templateUrl: './verifyemail.html',
  styleUrls: ['../twofa.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TwofaVerifyEmailSettingsComponent {
  @Input() email: string;
  @Input() tfaInfo: TfaInfo;
  @Input() action: TwoFaActionType;
  @Output() finishVerifyEmailEvent = new EventEmitter();

  otpId: string;
  sanitizedCode: string;
  code = '';
  error = new Error();

  sendOtpButtonOptions = <LoadingButtonOptions>{
    text: 'Send verification code',
    disabled: false,
    loading: false
  };

  continueButtonOptions = <LoadingButtonOptions>{
    disabled: true
  };

  constructor(private tfaService: TfaService, private modalService: ModalService) {}

  initData() {
    this.otpId = '';
    this.sanitizedCode = '';
    this.code = '';
    this.error = new Error();
    this.sendOtpButtonOptions.text = 'Send verification code';
  }

  sendOtpCodeToEmail() {
    this.sendOtpButtonOptions.loading = true;
    let intentType = TFAIntentType.ENABLE_TFA;
    if (this.action === TwoFaActionType.DISABLE_TFA) {
      intentType = TFAIntentType.DISABLE_TFA;
    } else if (this.action === TwoFaActionType.CREATE_RECOVERY_KEY) {
      intentType = TFAIntentType.REFRESH_RECOVERY_KEY;
    }
    this.tfaService.sendOtpCodeToEmail(new SendOtpCodeRequest(intentType)).subscribe(
      (response: SendOtpCodeResponse) => {
        this.otpId = response.otpId;
        this.sanitizedCode = response.sanitizedCode;
        this.sendOtpButtonOptions = { ...this.sendOtpButtonOptions, loading: false, text: 'Resend verification code' };
      },
      _ => {
        this.sendOtpButtonOptions.loading = false;
        this.error.serverError = MessageConstants.GENERAL_ERROR;
      }
    );
  }

  validateCode() {
    this.resetError();
    const canCountinue = !!this.code;
    this.continueButtonOptions.disabled = !canCountinue;
  }

  continue() {
    if (this.validate()) {
      this.continueButtonOptions.loading = true;

      this.tfaService
        .verify2Fa(
          new Verify2FaRequest({
            otpId: this.otpId,
            otpCode: this.sanitizedCode + '-' + this.code.trim(),
            type: Verify2FaType.system
          })
        )
        .subscribe(
          (response: Verify2FaResponse) => {
            if (this.action !== 'createRecoveryKey') {
              this.toggle(response.tfaSession);
            } else {
              this.createRecoveryKey(response.tfaSession);
            }
            this.continueButtonOptions.loading = false;
          },
          error => {
            this.continueButtonOptions.loading = false;
            const data = error.error;
            if (data.code === 'auth.OtpCodeInvalid') {
              this.error.code = 'Invalid code';
            } else if (data.code === 'auth.OtpExpired' || data.code === 'OtpFlowDurationExpiredException') {
              this.error.code = 'The provided code has expired';
            } else {
              this.error.serverError = MessageConstants.GENERAL_ERROR;
            }
          }
        );
    }
  }

  private validate() {
    this.resetError();
    if (!this.code) {
      this.error.code = 'Please enter the verification code';
    }
    return !this.error.hasError();
  }

  private resetError() {
    this.error = new Error();
  }

  private toggle(tfaSession: string) {
    //TODO verify this
    this.tfaService.toggle2Fa(new Toggle2FaRequest(tfaSession)).subscribe(
      (response: Toggle2FaResponse) => {
        this.tfaInfo.recoveryKey = response.recoveryKey;
        this.continueButtonOptions.loading = false;

        if (response.recoveryKey) {
          this.tfaInfo.tfaEnabled = true;
          this.finishVerifyEmailEvent.emit('continue');
        } else {
          this.tfaInfo.tfaEnabled = false;
          this.modalService.openSuccessModal('Two-Factor Authentication has been disabled.');
          this.finishVerifyEmailEvent.emit('cancel');
        }
      },
      error => {
        this.continueButtonOptions.loading = false;
        this.error.serverError = MessageConstants.GENERAL_ERROR;
      }
    );
  }

  private createRecoveryKey(tfaSession: string) {
    this.tfaService.refreshRecoveryCode(new Toggle2FaRequest(tfaSession)).subscribe(
      (response: RefreshRecoveryKeyResponse) => {
        this.tfaInfo.recoveryKey = response.recoveryKey;
        this.continueButtonOptions.loading = false;
        this.finishVerifyEmailEvent.emit('continue');
      },
      _ => {
        this.continueButtonOptions.loading = false;
        this.error.serverError = MessageConstants.GENERAL_ERROR;
      }
    );
  }
}
