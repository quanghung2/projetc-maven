import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import {
  ActionDef,
  ActionSubroutineCall,
  ActionSubroutineConfig,
  DataSourceService,
  FlowQuery,
  OutputContextVariable,
  SubTypeVariable,
  VariableForAction
} from '@b3networks/api/flow';
import { cloneDeep } from 'lodash';
import { BaseActionFlowComponent } from '../base-action-flow/base-action-flow.component';

@Component({
  selector: 'b3n-def-action-subroutine-call',
  templateUrl: './def-action-subroutine-call.component.html',
  styleUrls: ['./def-action-subroutine-call.component.scss']
})
export class DefActionSubroutineCallComponent extends BaseActionFlowComponent implements OnInit {
  @Input() contextVariables: VariableForAction[];
  @Input() selectedActionDef: ActionDef;
  @Input() actionDetail: ActionSubroutineCall;
  @Input() disabledEdit: boolean;
  @Output() changeConfigs = new EventEmitter<ActionSubroutineConfig>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() invalid = new EventEmitter<boolean>();

  formConfigs: UntypedFormGroup;

  get mappings(): UntypedFormArray {
    return this.formConfigs.get('mappings') as UntypedFormArray;
  }

  constructor(
    fb: UntypedFormBuilder,
    cdr: ChangeDetectorRef,
    dataSourceService: DataSourceService,
    private flowQuery: FlowQuery
  ) {
    super(fb, cdr, dataSourceService);
  }

  ngOnInit() {
    const flow = this.flowQuery.getValue();
    const editable = flow.editable && !this.disabledEdit;

    const formMapping = this.fb.array([]);

    if (this.actionDetail) {
      this.selectedActionDef.parameters?.forEach(p => {
        if (!p.hidden) {
          const mapping = this.actionDetail.configs.mappings.find(j => j.key === p.key);
          formMapping.push(this.createFormGroup(p, editable, mapping));
        }
      });
    } else {
      this.selectedActionDef.parameters?.forEach(p => {
        if (!p.hidden) {
          formMapping.push(this.createFormGroup(p, editable));
        }
      });
    }

    this.fetchSelections(flow);

    this.updateVisibleParams(formMapping);

    this.formConfigs = this.fb.group({
      mappings: formMapping
    });

    if (!editable) {
      this.formConfigs.disable();
    }

    this.formConfigs.valueChanges.subscribe(() => {
      this.emitValue();
    });
    this.formConfigs.updateValueAndValidity({ emitEvent: true });
  }

  selectValue(event: OutputContextVariable, item: UntypedFormGroup) {
    const data = (event as OutputContextVariable)?.data;
    delete data?.label;
    if (item.get('isOptional').value && data == null) {
      item.get('expressionTree').setValue({
        type: SubTypeVariable.NullExp
      });
    } else {
      item.get('expressionTree').setValue(data);
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
}
