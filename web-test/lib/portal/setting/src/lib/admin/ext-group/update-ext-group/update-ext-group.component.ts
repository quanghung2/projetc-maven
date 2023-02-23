import { SelectionModel } from '@angular/cdk/collections';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { KeyValue } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import {
  ExtensionBase,
  MailBox,
  MailBoxAction,
  SpeechEntry,
  Text2Speech,
  Text2SpeechCommon,
  Text2SpeechEntry
} from '@b3networks/api/bizphone';
import {
  ExtensionGroup,
  ExtensionGroupService,
  ExtensionService,
  ExtensionUtilsService,
  LatestExtKeyInfo
} from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, startWith, takeUntil, tap } from 'rxjs/operators';

export interface UpdateExtensionGroup {
  extensionGroup?: ExtensionGroup;
}

@Component({
  selector: 'b3n-update-ext-group',
  templateUrl: './update-ext-group.component.html',
  styleUrls: ['./update-ext-group.component.scss']
})
export class UpdateExtGroupComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  extensionGroup$: Observable<ExtensionGroup>;

  extKey: string;
  extKeyCtrl = new UntypedFormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(5)]);
  extLabelCtrl = new UntypedFormControl(null, [Validators.required, Validators.maxLength(160)]);
  extRingModeCtrl = new UntypedFormControl(null, Validators.required);
  extRingTimeCtrl = new UntypedFormControl(null, Validators.required);

  searchCtrl = new UntypedFormControl();
  selectedExtCtrl = new UntypedFormControl();
  displayedColumns = ['select', 'extKey', 'extLabel', 'enablePinLogin'];
  selection = new SelectionModel<string>(true, []);
  extensions$: Observable<ExtensionBase[]>;
  extensions: ExtensionBase[] = [];
  saving: boolean;
  isUpdate: boolean;
  loading: boolean;
  inboundMissedCallsFG: UntypedFormGroup;
  cancelFG: UntypedFormGroup;

  readonly ringMode: KeyValue<string, string>[] = [
    { key: 'ringAll', value: 'Ring All' },
    { key: 'sequential', value: 'Sequential' },
    { key: 'roundRobin', value: 'Round Robin' },
    { key: 'longestIdle', value: 'Longest Idle' }
  ];

  readonly optRingTime: KeyValue<number, string>[] = [
    { key: 15, value: '15' },
    { key: 20, value: '20' },
    { key: 30, value: '30' },
    { key: 45, value: '45' },
    { key: 60, value: '60' },
    { key: 90, value: '90' }
  ];

  readonly missedCallsType: KeyValue<string, string>[] = [
    { key: 'HANGUP_WITH_MSG', value: 'Play Message' },
    { key: 'RECORD_VOICEMAIL', value: 'Record Voicemail' },
    { key: 'HANGUP', value: 'Hang Up' }
  ];

  readonly statusFG = {
    action: [''],
    email: ['', [Validators.email]],
    tts: [null],
    msg: [null]
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: UpdateExtensionGroup,
    private dialogRef: MatDialogRef<UpdateExtGroupComponent>,
    private extensionGroupService: ExtensionGroupService,
    private extensionService: ExtensionService,
    private extUtilService: ExtensionUtilsService,
    private toastr: ToastService,
    private fb: UntypedFormBuilder
  ) {
    super();
  }

  async ngOnInit(): Promise<void> {
    this.initForm();

    const cancel = cloneDeep(this.data?.extensionGroup?.mailBox?.cancel);
    const { cancel: cancelFG } = this.inboundMissedCallsFG.controls as {
      [key: string]: UntypedFormGroup;
    };

    this.initValueFGs(cancelFG, cancel);
    this.loading = true;
    this.extensions = await this.extensionService.getAllExtenison(false, { filterGroupable: 'true' }).toPromise();

    this.isUpdate = this.data.extensionGroup instanceof ExtensionGroup;
    if (this.isUpdate) {
      this.extLabelCtrl.setValue(this.data.extensionGroup.extLabel);
      this.extRingModeCtrl.setValue(this.data.extensionGroup.callflowConfig.ringMode);
      this.extRingTimeCtrl.setValue(this.data.extensionGroup.callflowConfig.ringTime);
      this.selection.select(...this.data.extensionGroup.extList);
      if (this.selection.selected.length >= 20) {
        this.searchCtrl.disable();
      }
    } else {
      this.extUtilService
        .getLatestExtKey()
        .pipe(catchError(_ => of(<LatestExtKeyInfo>{})))
        .subscribe(res => {
          this.extKeyCtrl.setValue(+res.biggestKey + 1 || 100);
        });
    }

    this.extensions$ = <Observable<ExtensionBase[]>>this.searchCtrl.valueChanges.pipe(startWith('')).pipe(
      map(value => {
        if (typeof value === 'string') {
          const keyword = value.trim().toLowerCase();
          return this.extensions.filter(
            e => !this.selection.selected.includes(e.extKey) && e.displayText.trim().toLowerCase().includes(keyword)
          );
        }
        return [];
      })
    );

    this.loading = false;
  }

  initForm() {
    this.cancelFG = this.fb.group(this.statusFG);
    this.inboundMissedCallsFG = this.fb.group({
      cancel: this.cancelFG
    });

    this.listenToActions('cancel');
  }

  listenToActions(statuses: string) {
    const { action, email, msg } = (this.inboundMissedCallsFG.controls[statuses] as UntypedFormGroup).controls;

    action.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(value => {
          if (![MailBoxAction.RECORD_VOICEMAIL, MailBoxAction.HANGUP_WITH_MSG].includes(value)) {
            msg.setErrors(null);
          }

          email.setValue(this.data?.extensionGroup?.mailBox[statuses]?.notifyEmail);
          email.setErrors(null);
          email.setValidators(
            value === MailBoxAction.RECORD_VOICEMAIL ? [Validators.email, Validators.required] : [Validators.email]
          );
        })
      )
      .subscribe();
  }

  initValueFGs(fgArr: UntypedFormGroup, text2SpeechArr: Text2SpeechCommon) {
    fgArr.controls['action'].setValue(text2SpeechArr?.action || this.missedCallsType[2].key);
    fgArr.controls['tts'].setValue(text2SpeechArr?.msg?.entries[0] || new SpeechEntry());
    fgArr.controls['msg'].setValue(text2SpeechArr?.msg || new Text2Speech());
  }

  ttsChanged(e: { event: Text2SpeechEntry; msg: Text2Speech }) {
    if (!e.msg) {
      e.msg = new Text2Speech();
    }

    e.msg.entries = [];
    e.msg.entries.push(e.event);
  }

  saveOrUpdate() {
    const mailBox: Partial<MailBox> = {};

    this.setMailBoxParams(mailBox, this.inboundMissedCallsFG.controls['cancel'] as UntypedFormGroup, 'cancel');
    if (this.extLabelCtrl.valid) {
      this.saving = true;
      if (this.isUpdate) {
        this.extensionGroupService
          .update(<ExtensionGroup>{
            extKey: this.data.extensionGroup.extKey,
            extLabel: this.extLabelCtrl.value,
            extList: this.selection.selected,
            callflowConfig: { ringMode: this.extRingModeCtrl.value, ringTime: this.extRingTimeCtrl.value },
            mailBox: mailBox
          })
          .pipe(finalize(() => (this.saving = false)))
          .subscribe(
            _ => {
              this.toastr.success(`Extension group has been update`);
              this.dialogRef.close(true);
            },
            error => this.toastr.error(error.message)
          );
      } else {
        this.extensionGroupService
          .create(<ExtensionGroup>{
            extKey: this.extKeyCtrl.value,
            extLabel: this.extLabelCtrl.value,
            extList: this.selection.selected,
            callflowConfig: { ringMode: this.extRingModeCtrl.value, ringTime: this.extRingTimeCtrl.value },
            mailBox: mailBox
          })
          .pipe(finalize(() => (this.saving = false)))
          .subscribe(
            _ => {
              this.toastr.success(`Create extension group successfully`);
              this.dialogRef.close(true);
            },
            error => this.toastr.error(error.message)
          );
      }
    }
  }

  setMailBoxParams(mailBox: Partial<MailBox>, fgArr: UntypedFormGroup, statuses: string) {
    mailBox.cancel = cloneDeep(this.data.extensionGroup?.mailBox?.cancel) || new Text2SpeechCommon();
    mailBox.version = 'v2';
    mailBox[statuses].action = fgArr.controls['action'].value;
    mailBox[statuses].notifyEmail = fgArr.controls['email'].value;
    mailBox[statuses].msg = fgArr.controls['msg'].value;
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const text = event.option.value?.trim();
    if (!text) {
      return;
    }
    this.selection.selected.push(text);
    if (this.selection.selected.length >= 20) {
      this.searchCtrl.disable();
    }

    this.searchCtrl.setValue(null);
  }

  dropDispositionCodes(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.selection.selected, event.previousIndex, event.currentIndex);
  }

  deleteExt(extkey: string) {
    this.selection.selected.splice(this.selection.selected.indexOf(extkey), 1);
    if (this.selection.selected.length < 20) {
      this.searchCtrl.enable();
    }
  }
}
