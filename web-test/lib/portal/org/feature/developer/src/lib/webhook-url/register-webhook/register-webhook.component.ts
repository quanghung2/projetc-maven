import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CodeSample, ConfigurationService, Webhook } from '@b3networks/api/integration';
import { Validators } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

export interface StoreWebhookInput {
  type: 'view' | 'register';
  webhook: Webhook | null;
}

@Component({
  selector: 'b3n-register-webhook',
  templateUrl: './register-webhook.component.html',
  styleUrls: ['./register-webhook.component.scss']
})
export class UpdateConfigComponent implements OnInit {
  title: string;
  config: Webhook;
  registering: boolean;
  type: string;
  sampleBody: CodeSample;
  keysSampleBody = [];
  validators = new Validators();
  supportedCodeSampleList: CodeSample[];

  constructor(
    @Inject(MAT_DIALOG_DATA) input: StoreWebhookInput,
    private configurationService: ConfigurationService,
    private dialogRef: MatDialogRef<UpdateConfigComponent>,
    private toastService: ToastService
  ) {
    this.type = input.type;
    this.config = input.webhook || ({} as Webhook);
  }

  ngOnInit() {
    this.configurationService.fetchWebhookList().subscribe(codeSample => {
      this.supportedCodeSampleList = codeSample;
      if (this.config.code) {
        this.changeCode();
      }
    });

    this.title = this.type === 'view' ? 'Webhook details' : 'Register Webhook';
  }

  registerWebhook() {
    this.registering = true;
    if (this.validators.validURL(this.config.url)) {
      this.configurationService
        .register(this.config)
        .pipe(finalize(() => (this.registering = false)))
        .subscribe(
          _ => {
            this.dialogRef.close(true);
          },
          error => {
            this.toastService.warning(error.message);
          }
        );
    } else {
      this.registering = false;
      this.toastService.warning('Incorrect URL format');
    }
  }

  changeCode() {
    this.sampleBody = this.supportedCodeSampleList.find(codeSample => codeSample.code === this.config.code);
    this.keysSampleBody = this.sampleBody ? Object.keys(this.sampleBody['sample']) : [];
  }

  isObject(value): boolean {
    return value !== null && typeof value === 'object';
  }

  getObjectkeys(value: object): string[] {
    return Object.keys(value);
  }
}
