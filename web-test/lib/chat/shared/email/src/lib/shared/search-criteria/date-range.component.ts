import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { EmailSearchCriteria } from '@b3networks/api/workspace';
import { AbstractControl, UntypedFormControl, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'b3n-email-date-range',
  templateUrl: './date-range.component.html',
  styleUrls: ['./date-range.component.scss']
})
export class DateRangeComponent implements OnInit {
  @Output() changed: EventEmitter<EmailSearchCriteria> = new EventEmitter();

  LAUNCH_PRODUCTION_DATE = new Date(2018, 6, 1, 0, 0, 0, 0);
  range = new UntypedFormGroup({
    start: new UntypedFormControl({ value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), disabled: false }),
    end: new UntypedFormControl({ value: new Date(), disabled: false })
  });

  ngOnInit() {}

  onDateChanged() {
    if (this.start.value && this.end.value && this.range.valid) {
      const body: EmailSearchCriteria = <EmailSearchCriteria>{
        fromDate: this.start.value,
        toDate: this.end.value
      };
      this.changed.emit(body);
    }
  }

  get start(): AbstractControl {
    return this.range.get('start');
  }

  get end(): AbstractControl {
    return this.range.get('end');
  }
}
