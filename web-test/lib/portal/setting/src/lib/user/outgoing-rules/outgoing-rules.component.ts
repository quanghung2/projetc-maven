import { Component, ElementRef, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import {
  IAM_DNC_ACTIONS,
  IAM_SERVICES,
  IdentityProfileQuery,
  OrgMemberService,
  ProfileOrg
} from '@b3networks/api/auth';
import { ComplianceAction, Extension } from '@b3networks/api/bizphone';
import {
  AllowedCallerId,
  ExtensionQuery,
  ExtensionService,
  OutboundRule,
  OutboundRuleService
} from '@b3networks/api/callcenter';
import { LicenseFeatureCode } from '@b3networks/api/license';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { cloneDeep } from 'lodash';
import { Observable } from 'rxjs';
import { filter, finalize, map, take, takeUntil, tap } from 'rxjs/operators';
import { AppStateQuery } from '../../shared/state/app-state.query';

@Component({
  selector: 'b3n-outgoing-rules',
  templateUrl: './outgoing-rules.component.html',
  styleUrls: ['./outgoing-rules.component.scss']
})
export class OutgoingRulesComponent extends DestroySubscriberComponent implements OnInit {
  extension$: Observable<Extension>;
  currentOrg: ProfileOrg;

  allowedCallerId$: Observable<AllowedCallerId>;

  hasDnc$: Observable<boolean>;
  ocrs$: Observable<OutboundRule[]>;

  progressing: boolean;
  isAllowDNC: boolean;

  readonly ComplianceAction = ComplianceAction;

  payloadSpeedDial: HashMap<string>;
  speedDial: string[][];
  addSpeedDialFlag: boolean;
  editSpeedDialFlag: string;
  editSpeedDialError: string;
  phoneNumberTemp: string;
  form: UntypedFormGroup;

  constructor(
    private extensionQuery: ExtensionQuery,
    private extensionService: ExtensionService,
    private ocrService: OutboundRuleService,
    private appStateQuery: AppStateQuery,
    private toastService: ToastService,
    private fb: UntypedFormBuilder,
    private el: ElementRef,
    private orgMemberService: OrgMemberService,
    private profileQuery: IdentityProfileQuery
  ) {
    super();
  }

  ngOnInit() {
    this.initForm();
    this.profileQuery.currentOrg$
      .pipe(
        filter(p => p != null),
        take(1)
      )
      .subscribe(org => {
        this.currentOrg = org;
      });

    this.extension$ = this.extensionQuery.selectActive().pipe(
      filter(ext => ext != null && ext instanceof Extension),
      map(ext => new Extension(cloneDeep(ext))),
      tap(ext => {
        this.payloadSpeedDial = cloneDeep(ext.ringConfig.speedDial);
        this.speedDial = Object.entries(ext.ringConfig.speedDial).filter(s => s[1] !== '');
        this.orgMemberService.getPolicyDocument(X.orgUuid, ext.identityUuid).subscribe(policy => {
          this.isAllowDNC = policy.hasGrantedActionPermission(IAM_SERVICES.dnc, IAM_DNC_ACTIONS.update_setting);
        });
      })
    );

    this.extensionQuery
      .selectActiveId()
      .pipe(
        filter(ext => !!ext),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(extKey => {
        this.allowedCallerId$ = this.extensionQuery.selectAllowedCallerIdsForExt(extKey).pipe(
          filter(x => x != null),
          map(data => {
            const callerIds = <AllowedCallerId>{};
            Object.keys(data).forEach(key => {
              if (data[key]?.length > 0) {
                callerIds[key] = data[key]?.filter(x => !!x);
              }
            });
            return callerIds;
          })
        );
        this.extensionService.getAllowedCallerId(extKey as string).subscribe();
      });

    this.hasDnc$ = this.appStateQuery.assignedFeatureCodes$.pipe(map(codes => codes.includes(LicenseFeatureCode.dnc)));
    this.ocrs$ = this.ocrService.getOutboundRules();
  }

  initForm() {
    this.form = this.fb.group({
      key: ['', [Validators.required, Validators.pattern(/^\d{1,2}$/)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?\d{10,14}$/)]]
    });
  }

  phoneNumberChange(value: string) {
    this.editSpeedDialError = value
      ? !value.match(/^\+?\d{10,14}$/)
        ? '* Phone number requires the E.164 standard format'
        : ''
      : '* Phone number is required';

    if (!this.editSpeedDialError) {
      this.phoneNumberTemp = value;
    }
  }

  addSpeedDial() {
    const htmlEl: HTMLElement = this.el.nativeElement;
    const div: HTMLDivElement = htmlEl.querySelector(`.speed-dial__wrapper`);
    const { key, phoneNumber } = this.form.controls;
    const exist = this.speedDial.find(s => s[0] === key.value);

    if (exist) {
      exist[1] = phoneNumber.value;
    } else {
      this.speedDial.push([key.value, phoneNumber.value]);
    }

    this.payloadSpeedDial[key.value] = phoneNumber.value;
    this.form.reset();

    if (div) {
      setTimeout(() => {
        div.scrollTop = div.scrollHeight;
      }, 0);
    }
  }

  editPhoneNumber(index: number) {
    if (this.editSpeedDialError) {
      return;
    }

    this.editSpeedDialFlag = null;

    if (!this.phoneNumberTemp) {
      return;
    }

    this.speedDial[index][1] = this.phoneNumberTemp;
    this.payloadSpeedDial[this.speedDial[index][0]] = this.phoneNumberTemp;
    this.phoneNumberTemp = '';
  }

  startEditPhoneNumber(key: string) {
    this.editSpeedDialFlag = key;

    const htmlEl: HTMLElement = this.el.nativeElement;

    setTimeout(() => {
      const input: HTMLInputElement = htmlEl.querySelector(`.speed-dial__wrapper input`);
      input.focus();
    }, 0);
  }

  cancelEditPhoneNumber() {
    this.editSpeedDialFlag = null;
    this.editSpeedDialError = null;
  }

  escapeForm(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.editSpeedDialFlag = null;
      this.editSpeedDialError = null;
    }
  }

  delSpeedDial(index: number) {
    this.editSpeedDialFlag = null;
    this.editSpeedDialError = null;
    this.payloadSpeedDial[this.speedDial[index][0]] = '';
    this.speedDial.splice(index, 1);
  }

  onSave(extension: Extension) {
    this.progressing = true;
    this.editSpeedDialFlag = null;
    this.phoneNumberTemp = '';
    this.form.reset();
    this.extensionService
      .update(extension.extKey, {
        callerId: extension.callerId,
        dncAction: extension.dncAction,
        consentAction: extension.consentAction,
        outgoingCallRule: extension.outgoingCallRule,
        ringConfig: {
          ...extension.ringConfig,
          speedDial: this.payloadSpeedDial
        }
      })
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.toastService.success('Apply Successfully!');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  get key() {
    return this.form.controls['key'];
  }

  get phoneNumber() {
    return this.form.controls['phoneNumber'];
  }
}
