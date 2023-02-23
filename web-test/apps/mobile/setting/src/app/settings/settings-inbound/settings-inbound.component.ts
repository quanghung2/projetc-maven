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
import {
  Extension,
  MailBoxAction,
  SpeechEntry,
  Text2Speech,
  Text2SpeechCommon,
  Text2SpeechEntry
} from '@b3networks/api/bizphone';
import { ExtensionQuery, ExtensionService } from '@b3networks/api/callcenter';
import { DEFAULT_WARNING_MESSAGE, InboundCallDuring } from '@b3networks/portal/setting';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { filter, finalize, takeUntil, tap } from 'rxjs/operators';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'b3n-settings-inbound',
  templateUrl: './settings-inbound.component.html',
  styleUrls: ['./settings-inbound.component.scss']
})
export class SettingsInboundComponent
  extends DestroySubscriberComponent
  implements OnInit, AfterContentChecked, AfterViewInit
{
  @ViewChild('workingHours') workingHours: TemplateRef<any>;
  @ViewChild('nonOfficeHours') nonOfficeHours: TemplateRef<any>;
  @ViewChild('publicHoliday') publicHoliday: TemplateRef<any>;

  extension: Extension;
  form: UntypedFormGroup;
  saving: boolean;
  isMobileApp = true;

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
    { key: InboundCallDuring.WORKINGHOURS, value: 'Working hours' },
    { key: InboundCallDuring.NONEWORKINGHOURS, value: 'Non-working hours' },
    { key: InboundCallDuring.PUBLICHOLIDAYS, value: 'Public holidays' }
  ];

  readonly statusFG = {
    action: [''],
    email: ['', [Validators.email]],
    tts: [null],
    msg: [null]
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private extensionQuery: ExtensionQuery,
    private fb: UntypedFormBuilder,
    private extensionService: ExtensionService,
    private toastService: ToastService,
    public settingsService: SettingsService
  ) {
    super();
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  ngAfterContentChecked() {
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    this.initForm();
    this.extensionQuery
      .selectActive()
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(ext => !!ext),
        tap(ext => {
          this.extension = cloneDeep(new Extension(ext));

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

          availableFG.controls['action'].setValue(this.extension.incomingAction);

          this.initValueFGs(
            [busyFG, dndFG, offlineFG, nonOfficeHoursFG, publicHolidayFG],
            [busy, dnd, offline, nonOfficeHours, publicHoliday]
          );
        })
      )
      .subscribe();
  }

  initForm() {
    this.form = this.fb.group({
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

  initValueFGs(fgArr: UntypedFormGroup[], text2SpeechArr: Text2SpeechCommon[]) {
    for (let i = 0; i < fgArr.length; i++) {
      fgArr[i].controls['action'].setValue(text2SpeechArr[i].action);
      fgArr[i].controls['tts'].setValue(text2SpeechArr[i].msg.entries[0] || new SpeechEntry());
      fgArr[i].controls['msg'].setValue(text2SpeechArr[i].msg);
    }
  }

  ttsChanged(e: { event: Text2SpeechEntry; msg: Text2Speech }) {
    if (!e.msg) {
      e.msg = new Text2Speech();
    }

    e.msg.entries = [];
    e.msg.entries.push(e.event);
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

  save() {
    this.saving = true;

    const ext: Partial<Extension> = {};
    const { available, busy, dnd, offline, nonOfficeHours, publicHoliday } = this.form.controls as {
      [key: string]: UntypedFormGroup;
    };

    ext.mailBox = cloneDeep(this.extension.mailBox);
    ext.mailBox.version = 'v2';
    ext.incomingAction = available.controls['action'].value;

    this.setMailBoxParams(
      ext,
      [busy, dnd, offline, nonOfficeHours, publicHoliday],
      ['busy', 'dnd', 'offline', 'nonOfficeHours', 'publicHoliday']
    );

    this.extensionService
      .update(this.extension.extKey, ext)
      .pipe(
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe(
        _ => this.toastService.success('Your changes have been saved successfully'),
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
}
