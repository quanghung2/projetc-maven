import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import {
  ActionApi,
  ActionApiConfig,
  ActionDef,
  DataSourceService,
  FlowQuery,
  MappingExtended,
  OutputContextVariable,
  SubTypeVariable,
  VariableForAction
} from '@b3networks/api/flow';
import { ReqValidate, Utils, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { BaseActionFlowComponent } from '../base-action-flow/base-action-flow.component';

@Component({
  selector: 'b3n-def-action-api',
  templateUrl: './def-action-api.component.html',
  styleUrls: ['./def-action-api.component.scss']
})
export class DefActionApiComponent extends BaseActionFlowComponent implements OnInit {
  @Input() contextVariables: VariableForAction[];
  @Input() selectedActionDef: ActionDef;
  @Input() actionDetail: ActionApi;
  @Input() disabledEdit: boolean;
  @Output() changeConfigs = new EventEmitter<ActionApiConfig>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() invalid = new EventEmitter<boolean>();

  editable: boolean;
  formConfigs: UntypedFormGroup;

  textErrorOutsides: string[] = [];
  readonly reqValidateKey: ReqValidate = {
    maxlength: ValidateStringMaxLength.USER_INPUT,
    dataType: 'string',
    required: true
  };

  get formExtended(): UntypedFormArray {
    return this.formConfigs.get('extendedMappings') as UntypedFormArray;
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
    this.editable = flow.editable && !this.disabledEdit;

    const formUrl = this.fb.array([]);
    const formHeader = this.fb.array([]);
    const formBody = this.fb.array([]);
    const formExtended = this.fb.array([]);

    if (this.actionDetail) {
      this.selectedActionDef.urlParameters?.forEach(p => {
        if (!p.hidden) {
          const mapping = this.actionDetail.configs.urlMappings.find(j => j.key === p.key);
          formUrl.push(this.createFormGroup(p, this.editable, mapping));
        }
      });
      this.selectedActionDef.headersParameters?.forEach(p => {
        if (!p.hidden) {
          const mapping = this.actionDetail.configs.headersMappings.find(j => j.key === p.key);
          formHeader.push(this.createFormGroup(p, this.editable, mapping));
        }
      });
      this.selectedActionDef.bodyParameters?.forEach(p => {
        if (!p.hidden) {
          const mapping = this.actionDetail.configs.bodyMappings.find(j => j.key === p.key);
          formBody.push(this.createFormGroup(p, this.editable, mapping));
        }
      });
      if (this.selectedActionDef.extendablePath) {
        this.actionDetail.configs.extendedMappings?.forEach(mapping => {
          this.addMapping(mapping, formExtended);
        });
      }
    } else {
      this.selectedActionDef.urlParameters?.forEach(p => {
        if (!p.hidden) {
          formUrl.push(this.createFormGroup(p, this.editable));
        }
      });
      this.selectedActionDef.headersParameters?.forEach(p => {
        if (!p.hidden) {
          formHeader.push(this.createFormGroup(p, this.editable));
        }
      });
      this.selectedActionDef.bodyParameters?.forEach(p => {
        if (!p.hidden) {
          formBody.push(this.createFormGroup(p, this.editable));
        }
      });
    }

    this.fetchSelections(flow);

    this.updateVisibleParams(formUrl);
    this.updateVisibleParams(formHeader);
    this.updateVisibleParams(formBody);

    this.formConfigs = this.fb.group({
      urlMappings: formUrl,
      headersMappings: formHeader,
      bodyMappings: formBody,
      extendedMappings: formExtended
    });

    if (!this.editable) {
      this.formConfigs.disable();
    }

    this.formConfigs.valueChanges.subscribe(() => {
      this.emitValue();
    });
    this.formConfigs.updateValueAndValidity({ emitEvent: true });
  }

  addMapping(mapping?: MappingExtended, forms?: UntypedFormArray) {
    if (mapping) {
      if (mapping.keyUsingExpressionTree.type === SubTypeVariable.PlaceholderExp) {
        mapping.keyUsingExpressionTree = null;
      }
      if (mapping.expressionTree.type === SubTypeVariable.PlaceholderExp) {
        mapping.expressionTree = null;
      }
    }

    const form = this.fb.group({
      keyUsingExpressionTree: [mapping?.keyUsingExpressionTree ?? null, Utils.validateExp(this.reqValidateKey)],
      dataType: [mapping?.dataType ?? '', Validators.required],
      expressionTree: [
        mapping?.expressionTree ?? null,
        Utils.validateExp({ ...this.reqValidate, dataType: mapping?.dataType, required: true })
      ]
    });

    if (this.editable) {
      form.get('dataType').valueChanges.subscribe(dataType => {
        form.get('expressionTree').setValue(null, { emitEvent: false });
        form
          .get('expressionTree')
          .setValidators(Utils.validateExp({ ...this.reqValidate, dataType: dataType, required: true }));
        form.get('expressionTree').updateValueAndValidity({ emitEvent: false });
      });
    }

    if (forms) {
      forms.push(form);
    } else {
      this.formExtended.push(form);
    }
    this.textErrorOutsides.push('');
  }

  removeMapping(index: number) {
    this.formExtended.removeAt(index);
    this.textErrorOutsides.splice(index, 1);
  }

  selectValue(event: OutputContextVariable, form: UntypedFormGroup, key: string, index?: number) {
    const data = (event as OutputContextVariable)?.data;
    delete data?.label;
    form.get(key).setValue(data);

    if (key === 'keyUsingExpressionTree') {
      const keyExpCtrl = form.get('keyUsingExpressionTree') as FormControl;
      if (this.formExtended.value.filter(i => Utils.compareObject(i.keyUsingExpressionTree, data)).length > 1) {
        this.textErrorOutsides[index] = `Key is already exists`;
      } else {
        this.textErrorOutsides[index] = ``;
      }
      keyExpCtrl.setValidators(Utils.validateExp(this.reqValidateKey));
      keyExpCtrl.updateValueAndValidity();
    }
  }

  private emitValue() {
    setTimeout(() => {
      this.showOptionalParam = this.isShowOptionalParam(this.formConfigs);
    });
    if (this.formConfigs.valid && this.textErrorOutsides.every(text => text === '')) {
      this.changeConfigs.emit(this.getConfigs(this.formConfigs));
      this.invalid.emit(false);
    } else {
      this.invalid.emit(true);
    }
  }
}
