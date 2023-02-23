import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import {
  ActionTransform,
  ActionTransformConfig,
  ExpressionTree,
  FlowQuery,
  FunctionService,
  FunctionVariable,
  VariableForAction
} from '@b3networks/api/flow';
import { Utils, ValidateNumberValue, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';

@Component({
  selector: 'b3n-def-action-transform',
  templateUrl: './def-action-transform.component.html',
  styleUrls: ['./def-action-transform.component.scss']
})
export class DefActionTransformComponent implements OnInit {
  @Input() contextVariables: VariableForAction[];
  @Input() actionDetail: ActionTransform;
  @Input() disabledEdit: boolean;
  @Output() changeConfigs = new EventEmitter<ActionTransformConfig>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() invalid = new EventEmitter<boolean>();

  editable: boolean;
  funcTransforms: FunctionVariable[];
  formConfigs: UntypedFormGroup;

  get type(): UntypedFormControl {
    return this.formConfigs.get('transformFunction.type') as UntypedFormControl;
  }

  get argumentsFake(): UntypedFormArray {
    return this.formConfigs.get('transformFunction.argumentsFake') as UntypedFormArray;
  }

  constructor(private fb: UntypedFormBuilder, private flowQuery: FlowQuery, private functionService: FunctionService) {}

  ngOnInit(): void {
    const flow = this.flowQuery.getValue();
    this.editable = flow.editable && !this.disabledEdit;

    this.formConfigs = this.fb.group({
      transformFunction: this.fb.group({
        type: ['', Validators.required],
        arguments: null,
        argumentsFake: this.fb.array([])
      })
    });

    this.functionService.getFuntionTransform().subscribe(res => {
      this.funcTransforms = res;

      if (this.actionDetail) {
        this.type.patchValue(this.actionDetail.configs.transformFunction.type);
        const curFunc = this.funcTransforms.find(f => f.token === this.actionDetail.configs.transformFunction.type);
        if (curFunc) {
          this.createArguments(curFunc, this.actionDetail.configs.transformFunction.arguments);
        }
      } else {
        if (res.length > 0) {
          this.type.setValue(res[0].token);
          this.createArguments(res[0]);
        }
      }

      if (!this.editable) {
        this.formConfigs.disable();
      }

      setTimeout(() => {
        this.emitValue();
      });

      this.formConfigs.valueChanges.subscribe(() => {
        this.emitValue();
      });
    });
  }

  changeTransform(e: MatSelectChange) {
    const curFunc = this.funcTransforms.find(f => f.token === e.value);
    if (curFunc) {
      this.createArguments(curFunc);
    }
  }

  selectParams(event, func: UntypedFormGroup) {
    func.get('expressionTree').setValue(event?.data);
  }

  private createArguments(func: FunctionVariable, curArguments?: ExpressionTree[]) {
    this.argumentsFake.clear();
    if (curArguments) {
      for (let i = 0; i < func.arguments.length; i++) {
        this.argumentsFake.push(
          this.fb.group({
            title: func.arguments[i].name,
            expressionTree: [
              curArguments[i] ? curArguments[i] : curArguments[i].value,
              Utils.validateExp({
                required: true,
                dataType: func.arguments[i].dataType,
                maxlength: ValidateStringMaxLength.USER_INPUT,
                max: ValidateNumberValue.MAX,
                min: ValidateNumberValue.MIN
              })
            ],
            dataType: func.arguments[i].dataType
          })
        );
      }
    } else {
      func.arguments.forEach(item => {
        this.argumentsFake.push(
          this.fb.group({
            title: item.name,
            expressionTree: [
              null,
              Utils.validateExp({
                required: true,
                dataType: item.dataType,
                maxlength: ValidateStringMaxLength.USER_INPUT,
                max: ValidateNumberValue.MAX,
                min: ValidateNumberValue.MIN
              })
            ],
            dataType: item.dataType
          })
        );
      });
    }
  }

  private emitValue() {
    if (this.formConfigs.valid) {
      const expressions = [];
      this.argumentsFake.value.forEach(item => {
        expressions.push(item.expressionTree);
      });
      const data = this.formConfigs.value;
      data.transformFunction.arguments = expressions;
      delete data.transformFunction.argumentsFake;
      this.changeConfigs.emit(data);
    }
    this.invalid.emit(this.formConfigs.invalid);
  }
}
