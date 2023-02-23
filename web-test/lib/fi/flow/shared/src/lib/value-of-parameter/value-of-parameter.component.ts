import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { OptionForControl, OutputContextVariable, VariableForAction } from '@b3networks/api/flow';
import { ReqValidate, ValidateNumberValue, ValidateStringMaxLength } from '../app-state/app-state.model';

@Component({
  selector: 'b3n-value-of-parameter',
  templateUrl: './value-of-parameter.component.html',
  styleUrls: ['./value-of-parameter.component.scss']
})
export class ValueOfParameterComponent implements OnInit, OnChanges {
  @Input() optionForControl: OptionForControl;
  @Input() valueListUuid: string;
  @Input() contextVariables: VariableForAction[];
  @Input() reqValidate: ReqValidate;
  @Output() selectedValue = new EventEmitter<OutputContextVariable>();

  myReqValidate: ReqValidate;

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['optionForControl']) {
      if (
        changes['optionForControl'].previousValue?.dataType !== this.optionForControl.dataType ||
        changes['optionForControl'].previousValue?.required !== this.optionForControl.required
      ) {
        this.setReqValidate();
      }
    }
  }

  ngOnInit(): void {
    if (this.reqValidate) {
      this.myReqValidate = { ...this.reqValidate };
    } else {
      this.setReqValidate();
    }
  }

  private setReqValidate() {
    switch (this.optionForControl.dataType) {
      case 'string':
        this.myReqValidate = <ReqValidate>{
          dataType: 'string',
          required: this.optionForControl.required,
          minlength: 0,
          maxlength: ValidateStringMaxLength.USER_INPUT
        };
        break;
      case 'number':
        this.myReqValidate = <ReqValidate>{
          dataType: 'number',
          required: this.optionForControl.required,
          min: ValidateNumberValue.MIN,
          max: ValidateNumberValue.MAX
        };
        break;
      case 'boolean':
        this.myReqValidate = <ReqValidate>{
          dataType: 'boolean',
          required: this.optionForControl.required
        };
        break;
    }
  }
}
