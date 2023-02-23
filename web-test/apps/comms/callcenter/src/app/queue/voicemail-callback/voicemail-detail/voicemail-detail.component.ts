import { COMMA, ENTER, SEMICOLON } from '@angular/cdk/keycodes';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { VoicemailConfig } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-voicemail-detail',
  templateUrl: './voicemail-detail.component.html',
  styleUrls: ['./voicemail-detail.component.scss']
})
export class VoicemailDetailComponent extends DestroySubscriberComponent implements OnInit {
  @Input() voicemailConfig: VoicemailConfig;
  @Output() isInvalidVoicemail = new EventEmitter<boolean>();

  selectable = false;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, COMMA, SEMICOLON];
  _form: UntypedFormGroup = this.fb.group({
    isEnabledSendToEmail: false,
    emails: [[], this.checkFormatAndRequiredEmail],
    valueInputChip: ['', this.checkRequired]
  });

  get valueInputChip() {
    return this._form.get('valueInputChip');
  }
  get isEnabledSendToEmail() {
    return this._form.get('isEnabledSendToEmail');
  }
  get emails() {
    return this._form.get('emails');
  }

  constructor(private fb: UntypedFormBuilder) {
    super();
  }

  ngOnInit() {
    this._form.statusChanges.pipe(takeUntil(this.destroySubscriber$)).subscribe(status => {
      this.isInvalidVoicemail.emit(status === 'INVALID');
    });

    this.isEnabledSendToEmail.valueChanges.pipe(takeUntil(this.destroySubscriber$)).subscribe(value => {
      setTimeout(() => {
        // trigger validator
        this.emails.updateValueAndValidity();
        this.valueInputChip.updateValueAndValidity();
      }, 0);
    });

    this.initialForm();
  }

  initialForm() {
    this._form.patchValue({
      isEnabledSendToEmail: this.voicemailConfig.isEnabledSendToEmail,
      emails: this.voicemailConfig.emails.map(item => new MatChipModel(item))
    });
  }

  addEmail(event: MatChipInputEvent): void {
    const value = event.value;
    this.addChip(value);

    // Reset the input value
    this.valueInputChip.setValue('');
  }

  addChip(value: string) {
    if (value && value.trim() !== '') {
      value = value.trim();
      const indexExist = this.emails.value.findIndex(
        x => x.name.toLocaleUpperCase().trim() === value.toLocaleUpperCase().trim()
      );
      if (indexExist === -1) {
        // Add
        const isValid = checkRegExEmail(value);
        if (!isValid) {
          this.emails.value.push({
            name: value.trim(),
            statusError: true
          });
        } else {
          this.emails.value.push({
            name: value.trim(),
            statusError: false
          });
        }
      } else {
        // Remove
        const item = JSON.parse(JSON.stringify(this.emails.value[indexExist]));
        this.emails.value.splice(indexExist, 1);
        this.emails.value.push(item);
      }
      this.emails.updateValueAndValidity();
    }
  }

  remove(index: number): void {
    const value = this.emails.value;
    value.splice(index, 1);
    this.emails.setValue(value);
    this.valueInputChip.updateValueAndValidity();
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

  checkRequired(control: AbstractControl): { [key: string]: boolean } {
    const value = control?.value;
    const root = control?.root;
    if (value === '') {
      if (root.value.isEnabledSendToEmail && root.value.emails.length === 0) {
        return { required: true };
      }
    }
    return null;
  }

  checkFormatAndRequiredEmail(control: AbstractControl): { [key: string]: boolean } {
    const emails = control?.value;
    const root = control?.root.value;
    if (emails && root.isEnabledSendToEmail) {
      if (emails.length <= 0) {
        return { required: true };
      } else {
        const isError = emails.some(x => x.statusError);
        if (isError) {
          return { FORMAT_EMAIL: true };
        }
      }
    }
    return null;
  }
}

export class MatChipModel {
  name: string;
  statusError = false;
  constructor(name: string) {
    this.name = name;
    const isValid = checkRegExEmail(name);
    if (!isValid) {
      this.statusError = true;
    } else {
      this.statusError = false;
    }
  }
}

export function checkRegExEmail(value: string) {
  const regEmail = /^[a-zA-Z][a-zA-Z0-9-+_\.]{0,32}@[a-zA-Z0-9]{1,32}(\.[a-zA-Z0-9]{1,32}){1,32}$/;
  if (value.match(regEmail)) {
    return true;
  }
  return false;
}
