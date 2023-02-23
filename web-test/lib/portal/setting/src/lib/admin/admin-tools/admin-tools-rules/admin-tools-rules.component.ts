import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup, Validators } from '@angular/forms';
import { Extension } from '@b3networks/api/bizphone';
import {
  ExtensionQuery,
  InboundRule,
  InboundRuleService,
  OutboundRule,
  OutboundRuleService
} from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { cloneDeep } from 'lodash';
import { Observable } from 'rxjs';
import { distinctUntilKeyChanged, filter, takeUntil, tap } from 'rxjs/operators';
import { FEATURE_CHECKBOXES, PERMISSION_CHECKBOXES } from '../../../shared/contants';

@Component({
  selector: 'b3n-admin-tools-rules',
  templateUrl: './admin-tools-rules.component.html',
  styleUrls: ['./admin-tools-rules.component.scss']
})
export class AdminToolsRulesComponent extends DestroySubscriberComponent implements OnInit {
  @Input() form: UntypedFormGroup;

  extension: Extension;
  outbound$: Observable<OutboundRule[]>;
  inbound$: Observable<InboundRule[]>;

  PERMISSION_CHECKBOXES = PERMISSION_CHECKBOXES;
  FEATURE_CHECKBOXES = FEATURE_CHECKBOXES;

  constructor(
    private extensionQuery: ExtensionQuery,
    private ocrService: OutboundRuleService,
    private inboundRuleService: InboundRuleService
  ) {
    super();
  }

  ngOnInit(): void {
    this.outbound$ = this.ocrService.getOutboundRules();
    this.inbound$ = this.inboundRuleService.getInboundRules();
    this.extensionQuery
      .selectActive()
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(ext => !!ext && ext instanceof Extension),
        distinctUntilKeyChanged('extKey'),
        tap(ext => {
          this.extension = new Extension(cloneDeep(ext));
          this.form.controls['outbound'].setValue(this.extension.outgoingCallRule || '');
          this.form.controls['inbound'].setValue(this.extension.incomingCallRule || '');
          this.form.controls['passcode'].setValue(this.extension.pin.passCode);
          this.form.controls['passcode'].setValidators([
            Validators.required,
            Validators.minLength(4),
            Validators.maxLength(8)
          ]);

          const permissionCheckboxes: UntypedFormGroup = this.form.controls['permissionCheckboxes'] as UntypedFormGroup;

          permissionCheckboxes.controls['allowCallRecording'].setValue(this.extension.crConfig.isConfigurable);
          permissionCheckboxes.controls['allowPrivateCallerId'].setValue(
            this.extension.transferCallerIdConfig.allowPrivateCallerId
          );

          const featureCheckboxes: UntypedFormGroup = this.form.controls['featureCheckboxes'] as UntypedFormGroup;

          featureCheckboxes.controls['usingPin'].setValue(this.extension.pin.usingPin);
          featureCheckboxes.controls['enableCallWaiting'].setValue(this.extension.ringConfig.enableCallWaiting);
          featureCheckboxes.controls['enableDebugMode'].setValue(this.extension.enableDebugMode);
          featureCheckboxes.controls['enableAndroidBackground'].setValue(this.extension.enableAndroidBackgroundMode);
        })
      )
      .subscribe();
  }

  get permissionCheckboxes() {
    return Object.keys(this.form?.controls['permissionCheckboxes'].value);
  }

  get featureCheckboxes() {
    return Object.keys(this.form?.controls['featureCheckboxes'].value);
  }

  get usingPin() {
    const featureCheckboxes: UntypedFormGroup = this.form.controls['featureCheckboxes'] as UntypedFormGroup;
    return featureCheckboxes.controls['usingPin'];
  }

  get passcode() {
    return this.form.controls['passcode'];
  }
}
