import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import {
  ActionSubroutineConfig,
  ActionSubroutineReturn,
  BodyParameter,
  FlowQuery,
  Mapping,
  SubTypeVariable,
  VariableForAction
} from '@b3networks/api/flow';
import { Utils, ValidateNumberValue, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'b3n-def-action-subroutine-return',
  templateUrl: './def-action-subroutine-return.component.html',
  styleUrls: ['./def-action-subroutine-return.component.scss']
})
export class DefActionSubroutineReturnComponent implements OnInit {
  @Input() contextVariables: VariableForAction[];
  @Input() actionDetail: ActionSubroutineReturn;
  @Input() disabledEdit: boolean;
  @Output() changeConfigs = new EventEmitter<ActionSubroutineConfig>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() invalid = new EventEmitter<boolean>();

  formConfigs: UntypedFormGroup;

  get mappings(): UntypedFormArray {
    return this.formConfigs.get('mappings') as UntypedFormArray;
  }

  constructor(private fb: UntypedFormBuilder, private flowQuery: FlowQuery) {}

  ngOnInit() {
    const formMapping: UntypedFormGroup[] = [];
    const flow = this.flowQuery.getValue();
    const editable = flow.editable && !this.disabledEdit;

    if (this.actionDetail) {
      flow.subroutineOutput.parameters?.forEach(p => {
        const mapping = this.actionDetail.configs.mappings?.find(m => p.key === m.key);
        formMapping.push(this.createFormGroup(p, mapping, !editable));
      });
    } else {
      flow.subroutineOutput.parameters?.forEach(p => {
        if (!p.hidden) {
          formMapping.push(this.createFormGroup(p));
        }
      });
    }

    this.formConfigs = this.fb.group({
      mappings: this.fb.array(formMapping)
    });

    if (!editable) {
      this.formConfigs.disable();
    }

    this.formConfigs.valueChanges.subscribe(() => {
      this.emitValue();
    });
    this.formConfigs.updateValueAndValidity({ emitEvent: true });
  }

  private createFormGroup(param: BodyParameter, mapping?: Mapping, disabled?: boolean): UntypedFormGroup {
    if (mapping) {
      if (mapping.expressionTree.type === SubTypeVariable.PlaceholderExp) {
        mapping.expressionTree = null;
      }

      return this.fb.group({
        title: mapping.key,
        key: mapping.key,
        expressionTree: [
          mapping.expressionTree,
          Utils.validateExp({
            maxlength: ValidateStringMaxLength.USER_INPUT,
            min: ValidateNumberValue.MIN,
            max: ValidateNumberValue.MAX,
            dataType: param.dataType,
            required: true
          })
        ],
        isOptional: false,
        dataType: param.dataType,
        disabled: disabled
      });
    } else {
      const isDefaultValueTreeValue = !!(
        param.defaultValueTree?.value?.toString().length || param.defaultValueTree?.arguments?.length
      );

      return this.fb.group({
        title: param.title,
        key: param.key,
        expressionTree: [
          isDefaultValueTreeValue ? param.defaultValueTree : null,
          Utils.validateExp({
            maxlength: ValidateStringMaxLength.USER_INPUT,
            min: ValidateNumberValue.MIN,
            max: ValidateNumberValue.MAX,
            dataType: param.dataType,
            required: true
          })
        ],
        isOptional: false,
        dataType: param.dataType
      });
    }
  }

  private emitValue() {
    if (this.formConfigs.valid) {
      const configs = cloneDeep(this.formConfigs.value);
      configs.mappings = configs.mappings.map(item => {
        return { key: item.key, expressionTree: item.expressionTree };
      });
      this.changeConfigs.emit(configs);
      this.invalid.emit(false);
    } else {
      this.invalid.emit(true);
    }
  }

  selectValueOfConfig(item: UntypedFormGroup, event) {
    delete event?.data?.label;
    item.get('expressionTree').setValue(event?.data);
  }
}
