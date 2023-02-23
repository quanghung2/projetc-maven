import { AfterContentChecked, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import {
  ActionDef,
  ActionLooping,
  ActionLoopingConfig,
  ConnectorQuery,
  ConnectorService,
  ConnectorSuggestionReq,
  ExpressionTree,
  Flow,
  FlowQuery,
  OutputContextVariable,
  PropertyForVariable,
  SubTypeVariable,
  VariableForAction
} from '@b3networks/api/flow';
import {
  AppName,
  AppStateQuery,
  Utils,
  ValidateNumberValue,
  ValidateStringMaxLength
} from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { cloneDeep } from 'lodash';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-def-action-looping',
  templateUrl: './def-action-looping.component.html',
  styleUrls: ['./def-action-looping.component.scss']
})
export class DefActionLoopingComponent extends DestroySubscriberComponent implements OnInit, AfterContentChecked {
  @Input() contextVariables: VariableForAction[];
  @Input() actionDetail: ActionLooping;
  @Input() disabledEdit: boolean;
  @Output() changeActionDef = new EventEmitter<string>();
  @Output() changeConfigs = new EventEmitter<ActionLoopingConfig>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() invalid = new EventEmitter<boolean>();

  readonly AppName = AppName;
  flow: Flow;
  editable: boolean;
  contextVariablesArray: VariableForAction[];
  contextVariablesNotArray: VariableForAction[];
  actionDefs: ActionDef[];
  actionDefCtrl = new UntypedFormControl('', Validators.required);
  actionDef: ActionDef;
  propOfArrayExpression: PropertyForVariable;
  formConfigs: UntypedFormGroup;

  get maxAllowedIteration(): UntypedFormControl {
    return this.formConfigs.get('maxAllowedIteration') as UntypedFormControl;
  }
  getErrorMaxAllowedIteration() {
    return Utils.getErrorInput(this.maxAllowedIteration);
  }

  get subroutineMappings(): UntypedFormArray {
    return this.formConfigs.get('subroutineMappings') as UntypedFormArray;
  }

  constructor(
    private fb: UntypedFormBuilder,
    private cdr: ChangeDetectorRef,
    private appStateQuery: AppStateQuery,
    private flowQuery: FlowQuery,
    private connectorQuery: ConnectorQuery,
    private connectorService: ConnectorService
  ) {
    super();
  }

  ngOnInit(): void {
    this.flow = this.flowQuery.getValue();
    this.editable = this.flow.editable && !this.disabledEdit;

    this.formConfigs = this.fb.group({
      maxAllowedIteration: [null, Utils.validateInput({ required: true, dataType: 'number', min: 1, max: 100 })],
      arrayExpression: [null, Utils.validateExp({ required: true, dataType: 'array' })],
      subroutineMappings: this.fb.array([])
    });

    this.getConnectorSubroutine().subscribe(connectorSubroutine => {
      this.actionDefs = connectorSubroutine ? connectorSubroutine.actionDefs : [];

      this.actionDefCtrl.valueChanges.subscribe(uuid => {
        this.changeActionDef.emit(uuid);
        this.actionDef = this.actionDefs.find(a => a.uuid === uuid);
        this.initSubroutineMapping();
      });

      if (this.actionDetail) {
        this.actionDefCtrl.setValue(this.actionDetail.actionDef.actionDefUuid);
        this.actionDefCtrl.disable({ emitEvent: false });

        this.formConfigs.patchValue({
          maxAllowedIteration: this.actionDetail.configs.maxAllowedIteration,
          arrayExpression: this.actionDetail.configs.arrayExpression
        });
      }

      this.contextVariablesArray = cloneDeep(this.contextVariables);
      if (!this.editable) {
        this.actionDefCtrl.disable({ emitEvent: false });
        this.formConfigs.disable({ emitEvent: false });
      }

      setTimeout(() => {
        this.emitValue();
      });

      this.formConfigs.valueChanges.subscribe(() => {
        this.emitValue();
      });
    });
  }

  ngAfterContentChecked() {
    this.cdr.detectChanges();
  }

  private getConnectorSubroutine() {
    switch (this.appStateQuery.getName()) {
      case AppName.FLOW:
      case AppName.BUSINESS_ACTION_CREATOR:
        return this.connectorService
          .getConnectorsSuggestion(<ConnectorSuggestionReq>{ flowUuid: this.flow.uuid, version: this.flow.version })
          .pipe(
            map(connectors => {
              return connectors.find(c => c.type === 'SUBROUTINE');
            })
          );
      case AppName.PROGRAMMABLE_FLOW:
        return this.connectorQuery.selectAll({ filterBy: c => c.type === 'SUBROUTINE' }).pipe(
          takeUntil(this.destroySubscriber$),
          map(connectors => {
            return connectors[0];
          })
        );
    }
  }

  selectValue(event: OutputContextVariable) {
    this.formConfigs.get('arrayExpression').setValue(event.data);
    this.initSubroutineMapping();
  }

  selectValueMapping(event: OutputContextVariable, item: UntypedFormGroup) {
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

  selectProp(prop: PropertyForVariable) {
    this.propOfArrayExpression = prop;
    this.initSubroutineMapping();
  }

  private initSubroutineMapping() {
    if (this.subroutineMappings) {
      this.subroutineMappings.clear();
    }
    if (this.propOfArrayExpression && this.actionDef) {
      const contextVariablesNotArray = cloneDeep(this.contextVariables);
      const arrayExpression: ExpressionTree = this.formConfigs.get('arrayExpression').value;
      contextVariablesNotArray.map(vfa => {
        vfa.properties = vfa.properties
          .filter(
            x =>
              x.dataType !== 'array' ||
              (x.dataType === 'array' && Utils.compareObject(x.expressionTree, arrayExpression))
          )
          .map(p => {
            p.arrayItems?.map(
              i => (i.actionNameAndTitle = `${this.propOfArrayExpression.actionNameAndTitle}: ${i.title}`)
            );
            return p;
          });
      });
      this.contextVariablesNotArray = contextVariablesNotArray.filter(c => c.properties.length > 0);

      this.actionDef.parameters.forEach(p => {
        if (!p.hidden) {
          this.subroutineMappings.push(
            this.fb.group({
              title: p.title,
              key: p.key,
              dataType: p.dataType,
              disabled: !this.editable,
              isOptional: p.isOptional,
              expressionTree: [
                this.actionDetail
                  ? this.actionDetail.configs.subroutineMappings.find(m => m.key === p.key).expressionTree
                  : null,
                Utils.validateExp({
                  required: !p.isOptional,
                  dataType: p.dataType,
                  min: ValidateNumberValue.MIN,
                  max: ValidateNumberValue.MAX,
                  maxlength: ValidateStringMaxLength.USER_INPUT
                })
              ]
            })
          );
        }
      });
    } else {
      if (this.contextVariablesNotArray) {
        this.contextVariablesNotArray.length = 0;
      }
    }
  }

  private emitValue() {
    if (this.formConfigs.valid) {
      const configs = cloneDeep(this.formConfigs.value);
      configs.subroutineMappings = configs.subroutineMappings.map(item => {
        return { key: item.key, expressionTree: item.expressionTree };
      });
      this.changeConfigs.emit(configs);
    }
    this.invalid.emit(this.formConfigs.invalid || this.actionDefCtrl.invalid);
  }
}
