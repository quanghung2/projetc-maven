import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { TextTestUtils } from '@b3networks/comms/callcenter/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-textarea-sms',
  templateUrl: './textarea-sms.component.html',
  styleUrls: ['./textarea-sms.component.scss']
})
export class TextareaSMSComponent extends DestroySubscriberComponent implements OnInit {
  @Input() sms = '';
  @Output() isValid = new EventEmitter<boolean>();
  @Output() updateValue = new EventEmitter<string>();
  smsControl: UntypedFormControl = this.fb.control('', [Validators.required]);
  smsCounter = new SmsLengthCalculator({
    smsParts: 1,
    charsInOneSms: 136
  });

  constructor(private fb: UntypedFormBuilder) {
    super();
    this.smsControl.valueChanges.pipe(takeUntil(this.destroySubscriber$)).subscribe(value => {
      this.sms = value;
      this.updateValue.emit(value);
      this.calculateCouter(value);
    });

    this.smsControl.statusChanges.pipe(takeUntil(this.destroySubscriber$)).subscribe(status => {
      this.isValid.emit(status === 'VALID');
    });
  }

  ngOnInit() {
    this.smsControl.setValue(this.sms);
    if (this.sms && this.sms !== '') {
      this.calculateCouter(this.sms);
    }
  }

  calculateCouter(value: string) {
    const ischeckIsContainsNonLatinCodepoints = TextTestUtils.checkIsContainsNonLatinCodepoints(value);
    if (ischeckIsContainsNonLatinCodepoints) {
      this.smsCounter.charsInOneSms = value.length <= 46 ? 46 : 43;
    } else {
      this.smsCounter.charsInOneSms = value.length <= 136 ? 136 : 129;
    }
    this.smsCounter.smsParts = Math.floor(value.length / this.smsCounter.charsInOneSms) + 1;
  }
}

export class SmsLengthCalculator {
  smsParts?: number;
  charsInOneSms?: number;

  constructor(obj?: Partial<SmsLengthCalculator>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
