import { KeyValue } from '@angular/common';
import {
  AfterContentChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatTabChangeEvent } from '@angular/material/tabs';
import {
  Extension,
  MailBoxAction,
  SpeechEntry,
  Text2Speech,
  Text2SpeechCommon,
  Text2SpeechEntry
} from '@b3networks/api/bizphone';
import { ExtensionQuery, ExtensionService } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { filter, finalize, map, takeUntil, tap } from 'rxjs/operators';
import { DEFAULT_WARNING_MESSAGE } from '../../shared/contants';
import { InboundCallDuring } from '../../shared/enum/inbound-call-during.enum';

@Component({
  selector: 'b3n-incoming-rules',
  templateUrl: './incoming-rules.component.html',
  styleUrls: ['./incoming-rules.component.scss']
})
export class IncomingRulesComponent
  extends DestroySubscriberComponent
  implements OnInit, AfterContentChecked, AfterViewInit
{
  @ViewChild('workingHours') workingHours: TemplateRef<any>;
  @ViewChild('nonOfficeHours') nonOfficeHours: TemplateRef<any>;
  @ViewChild('publicHoliday') publicHoliday: TemplateRef<any>;

  readonly allActions: KeyValue<string, string>[] = [
    { key: MailBoxAction.RING_DEVICES, value: 'Ring Devices' },
    { key: MailBoxAction.CALL_DELEGATION, value: 'Ring Delegates' },
    { key: MailBoxAction.CALL_FORWARDING, value: 'Forward Calls' },
    { key: MailBoxAction.HANGUP_WITH_MSG, value: 'Play Message' },
    { key: MailBoxAction.RECORD_VOICEMAIL, value: 'Record Voicemail' },
    { key: MailBoxAction.HANGUP, value: 'Hang Up' }
  ];

  readonly availableActions: KeyValue<string, string>[] = [
    { key: MailBoxAction.RING_DEVICES, value: 'Ring Devices' },
    { key: MailBoxAction.CALL_DELEGATION, value: 'Ring Delegates' },
    { key: MailBoxAction.CALL_FORWARDING, value: 'Forward Calls' }
  ];

  readonly inboundCallDuringOptions: KeyValue<string, string>[] = [
    { key: InboundCallDuring.WORKINGHOURS, value: 'Working Hours' },
    { key: InboundCallDuring.NONEWORKINGHOURS, value: 'Non-Working Hours' },
    { key: InboundCallDuring.PUBLICHOLIDAYS, value: 'Public Holidays' }
  ];

  readonly statusFG = {
    action: [''],
    email: ['', [Validators.email]],
    tts: [null],
    msg: [null]
  };

  extension: Extension;
  defaultExtension: Extension;
  saving: boolean;
  form: UntypedFormGroup;

  constructor(
    private extensionQuery: ExtensionQuery,
    private extensionService: ExtensionService,
    private toastService: ToastService,
    private fb: UntypedFormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  ngAfterContentChecked() {
    this.cdr.detectChanges();
  }

  ngOnInit() {
    this.initForm();
    this.extensionQuery
      .selectActive()
      .pipe(
        filter(ext => ext != null && ext instanceof Extension),
        map(ext => new Extension(cloneDeep(ext))),
        takeUntil(this.destroySubscriber$),
        tap(ext => {
          this.extension = ext;
          this.defaultExtension = cloneDeep(ext);

          const { busy, dnd, offline, nonOfficeHours, publicHoliday } = this.extension.mailBox;
          const {
            available: availableFG,
            busy: busyFG,
            dnd: dndFG,
            offline: offlineFG,
            nonOfficeHours: nonOfficeHoursFG,
            publicHoliday: publicHolidayFG
          } = this.form.controls as {
            [key: string]: UntypedFormGroup;
          };

          availableFG.controls['action'].setValue(ext.incomingAction);

          this.initValueFGs(
            [busyFG, dndFG, offlineFG, nonOfficeHoursFG, publicHolidayFG],
            [busy, dnd, offline, nonOfficeHours, publicHoliday]
          );
        })
      )
      .subscribe();
  }

  initValueFGs(fgArr: UntypedFormGroup[], text2SpeechArr: Text2SpeechCommon[]) {
    for (let i = 0; i < fgArr.length; i++) {
      fgArr[i].controls['action'].setValue(text2SpeechArr[i].action);
      fgArr[i].controls['tts'].setValue(text2SpeechArr[i].msg.entries[0] || new SpeechEntry());
      fgArr[i].controls['msg'].setValue(text2SpeechArr[i].msg);
    }
  }

  initForm() {
    this.form = this.fb.group({
      callDuring: [InboundCallDuring.WORKINGHOURS],
      available: this.fb.group({
        action: [MailBoxAction.RING_DEVICES]
      }),
      busy: this.fb.group(this.statusFG),
      dnd: this.fb.group(this.statusFG),
      offline: this.fb.group(this.statusFG),
      nonOfficeHours: this.fb.group(this.statusFG),
      publicHoliday: this.fb.group(this.statusFG)
    });

    this.listenToActions(['busy', 'dnd', 'offline', 'nonOfficeHours', 'publicHoliday']);
  }

  listenToActions(statuses: string[]) {
    for (let i = 0; i < statuses.length; i++) {
      const { action, email, msg } = (this.form.controls[statuses[i]] as UntypedFormGroup).controls;

      action.valueChanges
        .pipe(
          takeUntil(this.destroySubscriber$),
          tap(value => {
            if (![MailBoxAction.RECORD_VOICEMAIL, MailBoxAction.HANGUP_WITH_MSG].includes(value)) {
              msg.setErrors(null);
            }

            email.setValue(this.extension.mailBox[statuses[i]]?.notifyEmail);
            email.setErrors(null);
            email.setValidators(
              value === MailBoxAction.RECORD_VOICEMAIL ? [Validators.email, Validators.required] : [Validators.email]
            );
          })
        )
        .subscribe();
    }
  }

  ttsChanged(e: { event: Text2SpeechEntry; msg: Text2Speech }) {
    if (!e.msg) {
      e.msg = new Text2Speech();
    }

    e.msg.entries = [];
    e.msg.entries.push(e.event);
  }

  tabChanged(e: MatTabChangeEvent) {
    switch (e.index) {
      case 0:
        this.form.controls['callDuring'].setValue(InboundCallDuring.WORKINGHOURS);
        break;

      case 1:
        this.form.controls['callDuring'].setValue(InboundCallDuring.NONEWORKINGHOURS);
        break;

      case 2:
        this.form.controls['callDuring'].setValue(InboundCallDuring.PUBLICHOLIDAYS);
        break;

      default:
        break;
    }
  }

  onSave() {
    this.saving = true;
    const ext: Partial<Extension> = {};
    ext.mailBox = cloneDeep(this.defaultExtension.mailBox);
    ext.mailBox.version = 'v2';

    switch (this.form.controls['callDuring'].value) {
      case InboundCallDuring.WORKINGHOURS:
        const { available, busy, dnd, offline } = this.form.controls as {
          [key: string]: UntypedFormGroup;
        };
        ext.incomingAction = available.controls['action'].value;
        this.setMailBoxParams(ext, [busy, dnd, offline], ['busy', 'dnd', 'offline']);
        break;

      case InboundCallDuring.NONEWORKINGHOURS:
        this.setMailBoxParams(ext, [this.form.controls['nonOfficeHours'] as UntypedFormGroup], ['nonOfficeHours']);
        break;

      case InboundCallDuring.PUBLICHOLIDAYS:
        this.setMailBoxParams(ext, [this.form.controls['publicHoliday'] as UntypedFormGroup], ['publicHoliday']);
        break;

      default:
        break;
    }

    this.extensionService
      .update(this.extension.extKey, ext)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        _ => this.toastService.success('Apply Successfully!'),
        error => {
          this.toastService.warning(error.message || DEFAULT_WARNING_MESSAGE);
        }
      );
  }

  setMailBoxParams(ext: Partial<Extension>, fgArr: UntypedFormGroup[], statuses: string[]) {
    for (let i = 0; i < fgArr.length; i++) {
      ext.mailBox[statuses[i]].action = fgArr[i].controls['action'].value;
      ext.mailBox[statuses[i]].notifyEmail = fgArr[i].controls['email'].value;
      ext.mailBox[statuses[i]].msg = fgArr[i].controls['msg'].value;
    }
  }

  isDisabledBtn() {
    if (!this.form || !this.form.controls) {
      return false;
    }

    const { busy, dnd, offline, nonOfficeHours, publicHoliday } = this.form.controls as {
      [key: string]: UntypedFormGroup;
    };

    switch (this.form.controls['callDuring'].value) {
      case InboundCallDuring.WORKINGHOURS:
        return busy.invalid || dnd.invalid || offline.invalid;
      case InboundCallDuring.NONEWORKINGHOURS:
        return nonOfficeHours.invalid;
      case InboundCallDuring.PUBLICHOLIDAYS:
        return publicHoliday.invalid;
      default:
        return false;
    }
  }

  get context() {
    const { busy, dnd, offline, nonOfficeHours, publicHoliday } = this.form.controls as {
      [key: string]: UntypedFormGroup;
    };

    return {
      available: this.form.controls['available'],
      busy,
      dnd,
      offline,
      nonOfficeHours,
      publicHoliday
    };
  }
}
