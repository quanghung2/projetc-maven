import { COMMA, ENTER, SEMICOLON } from '@angular/cdk/keycodes';
import { KeyValue } from '@angular/common';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExtensionBase } from '@b3networks/api/bizphone';
import { ExtensionQuery, RoutingConfigSip, SipAccount, SipTrunkService } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent, MyErrorStateMatcher } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { debounceTime, finalize, map, startWith, switchMap } from 'rxjs/operators';

export interface StoreIncomingSettingData {
  isCreate: boolean;
  routing: RoutingConfigSip;
  sip: SipAccount;
}

enum TypeForwardTo {
  Number = 'Number',
  SIP = 'SIP',
  Extension = 'Extension'
}

@Component({
  selector: 'b3n-store-incoming-setting',
  templateUrl: './store-incoming-setting.component.html',
  styleUrls: ['./store-incoming-setting.component.scss']
})
export class StoreIncomingSettingComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild('inputChip') inputChip: ElementRef;
  @ViewChild('inputNumber') inputNumber: ElementRef;

  text = '<country code> <phone number>';
  form: FormGroup;
  matcher = new MyErrorStateMatcher();
  separatorKeysCodes: number[] = [ENTER, COMMA, SEMICOLON];
  isProcessing: boolean;
  valueInputChip = this.fb.control('', [this.checkValidator.bind(this)]);
  formatSIP: RegExp = /^sip[a-zA-Z0-9][a-zA-Z0-9_\.]{0,32}@[a-zA-Z0-9]{1,32}(\.[a-zA-Z0-9]{1,32}){1,32}$/gi;
  extensions$: Observable<ExtensionBase[]>;

  readonly TypeForwardTo = TypeForwardTo;
  readonly typeRouting: KeyValue<TypeForwardTo, string>[] = [
    // { key: TypeForwardTo.Number, value: 'Number' },
    { key: TypeForwardTo.Extension, value: 'Extension' }
    // { key: TypeForwardTo.SIP, value: 'SIP' }
  ];

  get number() {
    return this.form.get('number');
  }
  get type() {
    return this.form.get('type');
  }
  get forwardTo() {
    return this.form.get('forwardTo');
  }
  get forwardToArray() {
    return this.form.get('forwardToArray');
  }
  get invalidForm() {
    return (
      this.number.invalid ||
      (this.type.value === TypeForwardTo.SIP ? this.forwardToArray.invalid : this.forwardTo.invalid)
    );
  }

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<StoreIncomingSettingComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: StoreIncomingSettingData,
    public dialog: MatDialog,
    private sipTrunkService: SipTrunkService,
    private toastService: ToastService,
    private extensionQuery: ExtensionQuery
  ) {
    super();
    if (this.data.isCreate) {
      this.form = this.fb.group({
        number: [null, [Validators.required]],
        type: [TypeForwardTo.Extension, [Validators.required]],
        forwardTo: [null, [Validators.required]],
        forwardToArray: [[], [this.checkLength.bind(this)]]
      });
    } else {
      const type = this.getTypeByForwardTo(data.routing);
      const forwardTo =
        type === TypeForwardTo.SIP ? this.data.routing.forwardTo.split(', ') : this.data.routing.forwardTo;
      this.form = this.fb.group({
        number: [this.data.routing.number, [Validators.required]],
        type: [{ value: type, disabled: true }, [Validators.required]],
        forwardTo: [type !== TypeForwardTo.SIP ? this.data.routing.forwardTo : '', [Validators.required]],
        forwardToArray: [
          type === TypeForwardTo.SIP ? this.data.routing.forwardTo.split(', ') : [],
          [Validators.required, Validators.minLength(1)]
        ]
      });
    }
  }

  ngOnInit() {
    this.type.valueChanges.subscribe(value => {
      setTimeout(() => {
        this.inputChip?.nativeElement?.focus();
        this.inputNumber?.nativeElement?.focus();
      }, 300);
    });

    this.extensions$ = this.forwardTo.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        console.log('value: ', value);
        if (value instanceof ExtensionBase || !value) {
          return this.extensionQuery.selectAll();
        }
        return this.extensionQuery.selectExtByText(value?.trim());
      }),
      map(ext => ext?.filter(e => e.extKey !== (<ExtensionBase>this.forwardTo?.value)?.extKey))
    );
  }

  extDisplayFn(member: ExtensionBase): string {
    return member ? member?.displayText : '';
  }

  addSip(event: MatChipInputEvent): void {
    if (this.valueInputChip.valid) {
      const value = event.value;
      this.addChip(value);

      // Reset the input value
      this.valueInputChip.setValue('');
    }
  }

  addChip(value: string) {
    if (value && value.trim() !== '') {
      value = value.trim();
      const indexExist = this.forwardToArray.value.findIndex(
        x => x.toLocaleUpperCase().trim() === value.toLocaleUpperCase().trim()
      );
      if (indexExist === -1) {
        // Add
        this.forwardToArray.value.push(value.trim());
      } else {
        // Remove
        const item = JSON.parse(JSON.stringify(this.forwardToArray.value[indexExist]));
        this.forwardToArray.value.splice(indexExist, 1);
        this.forwardToArray.value.push(item);
      }
      this.forwardToArray.updateValueAndValidity();
    }
  }

  remove(index: number): void {
    const value = this.forwardToArray.value;
    value.splice(index, 1);
    this.forwardToArray.setValue(value);
    this.forwardToArray.updateValueAndValidity();
  }

  onPaste(event: ClipboardEvent) {
    const clipboardData = event.clipboardData || window['clipboardData'];
    let pastedText = clipboardData.getData('text');

    if (pastedText.length > 0) {
      pastedText = pastedText.replace(/,|;| |\||\//gi, matched => {
        return '||||||||CREATE||||||||||';
      });
      const arr: string[] = pastedText.split('||||||||CREATE||||||||||');
      arr.forEach(item => {
        const trimItem = item.trim();
        this.addChip(trimItem);
      });

      // clear text input
      setTimeout(() => {
        this.valueInputChip.setValue('');
      }, 0);
    }
  }

  onSave() {
    this.isProcessing = true;
    const req: RoutingConfigSip = <RoutingConfigSip>{
      number: this.form.get('number').value
    };

    if (this.form.get('type').value === TypeForwardTo.SIP) {
      req.forwardTo = this.forwardToArray.value?.map(x => (x = 'sip:' + x))?.join(', ');
    } else if (this.form.get('type').value === TypeForwardTo.Extension) {
      req.forwardTo = 'ext:' + (<ExtensionBase>this.form.get('forwardTo').value)?.extKey;
    } else {
      req.forwardTo = this.form.get('forwardTo').value;
    }

    if (this.data.isCreate) {
      this.sipTrunkService
        .createRoutingConfig(this.data.sip.sipUsername, req)
        .pipe(finalize(() => (this.isProcessing = false)))
        .subscribe(
          res => {
            if (this.data.isCreate) {
              this.toastService.success('Created successfully!');
            } else {
              this.toastService.success('Edited successfully!');
            }
            this.dialogRef.close(true);
          },
          err => this.toastService.error(err.message)
        );
    } else {
    }
  }

  private getTypeByForwardTo(routing: RoutingConfigSip) {
    if (routing.forwardTo.startsWith('sip:')) {
      return TypeForwardTo.SIP;
    } else if (routing.forwardTo.startsWith('ext:')) {
      return TypeForwardTo.Extension;
    }
    return TypeForwardTo.Number;
  }

  private checkLength(control: FormControl) {
    const value = control.value;
    if (!value) {
      return null;
    }
    if (value?.length === 0) {
      return { minLength: true };
    }
    return null;
  }

  private checkValidator(control: FormControl) {
    const value = control.value.trim();
    if (!value) {
      return null;
    }
    if (!value.match(this.formatSIP)) {
      return { formatSIP: true };
    }
    return null;
  }
}
