import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import {
  OptionForControl,
  OutputContextVariable,
  PropertyForVariable,
  RenderDirective,
  RenderDirectiveType,
  VariableForAction
} from '@b3networks/api/flow';
import { ReqValidate, ValidateNumberValue, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';

@Component({
  selector: 'b3n-context-variable',
  templateUrl: './context-variable.component.html',
  styleUrls: ['./context-variable.component.scss']
})
export class ContextVariableComponent implements OnInit, OnChanges {
  @Input() optionForControl: OptionForControl;
  @Input() contextVariables: VariableForAction[];
  @Input() keyForContextVar: string;
  @Input() isMultiple = true;
  @Input() isShowContextVar = true;
  @Input() isShowInputControl = true;
  @Input() typeBooleanCheckbox = true;
  @Input() renderDirective: RenderDirective;
  @Input() reqValidate: ReqValidate;
  @Input() textErrorOutside: string;
  @Output() selectedValue = new EventEmitter<OutputContextVariable>();
  @Output() selectedProp = new EventEmitter<PropertyForVariable>();

  myRenderDir: RenderDirective;
  myReqValidate: ReqValidate;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['optionForControl']) {
      if (changes['optionForControl'].previousValue?.dataType !== this.optionForControl.dataType) {
        if (this.optionForControl.dataType === 'boolean') {
          if (this.typeBooleanCheckbox) {
            this.myRenderDir = null;
          } else {
            this.myRenderDir = { type: RenderDirectiveType.SuggestiveSingleSelect };
          }
        } else {
          this.myRenderDir = this.renderDirective;
        }
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

  selectValue(data: OutputContextVariable) {
    this.selectedValue.emit(data);
  }

  private setReqValidate() {
    switch (this.optionForControl.dataType) {
      case 'string':
        this.myReqValidate = <ReqValidate>{
          dataType: 'string',
          required: !this.optionForControl.isOptional,
          minlength: 0,
          maxlength: ValidateStringMaxLength.USER_INPUT,
          pattern: this.optionForControl.customRegexValidation
        };
        break;
      case 'number':
        this.myReqValidate = <ReqValidate>{
          dataType: 'number',
          required: !this.optionForControl.isOptional,
          min: ValidateNumberValue.MIN,
          max: ValidateNumberValue.MAX,
          pattern: this.optionForControl.customRegexValidation
        };
        break;
      case 'boolean':
      case 'array':
      case 'all':
        this.myReqValidate = <ReqValidate>{
          dataType: this.optionForControl.dataType,
          required: !this.optionForControl.isOptional,
          pattern: this.optionForControl.customRegexValidation
        };
        break;
    }
  }
}
