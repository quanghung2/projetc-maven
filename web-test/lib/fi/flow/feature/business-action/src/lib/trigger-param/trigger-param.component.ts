import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import {
  BodyParameter,
  Connector,
  ConnectorConfigBaUser,
  DataSourceService,
  ExpressionTree,
  Mapping,
  SubTypeVariable,
  TriggerBaUserReq,
  TriggerConfig,
  TriggerDef
} from '@b3networks/api/flow';
import { HashMap } from '@datorama/akita';
import { cloneDeep } from 'lodash';
import { SharedParamComponent } from '../shared/param.component';

@Component({
  selector: 'b3n-trigger-param',
  templateUrl: './trigger-param.component.html',
  styleUrls: ['./trigger-param.component.scss']
})
export class TriggerParamComponent extends SharedParamComponent implements OnInit {
  @Input() triggerDef: TriggerDef;
  @Input() triggerConfig: TriggerConfig;
  @Input() defaultParam: HashMap<string>;
  @Input() hideDefaultParam: boolean;
  @Input() allowEdit = true;
  @Output() changeConfigs = new EventEmitter<TriggerBaUserReq>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() invalid = new EventEmitter<boolean>();

  formTriggerConfig: UntypedFormGroup;
  connector: Connector;
  connectorConfigInvalid = false;
  connectorConfig: ConnectorConfigBaUser = null;

  constructor(fb: UntypedFormBuilder, dataSourceService: DataSourceService) {
    super(fb, dataSourceService);
  }

  ngOnInit(): void {
    const formUrl = this.fb.array([]);
    const formHeader = this.fb.array([]);
    const formBody = this.fb.array([]);

    if (this.triggerConfig) {
      this.triggerDef.urlParameters?.forEach(p => {
        const mapping = this.triggerConfig.urlMappings.find(m => m.key === p.key);
        formUrl.push(this.createFormGroup(p, !this.allowEdit, mapping));
      });
      this.triggerDef.headersParameters?.forEach(p => {
        const mapping = this.triggerConfig.headersMappings.find(m => m.key === p.key);
        formHeader.push(this.createFormGroup(p, !this.allowEdit, mapping));
      });
      this.triggerDef.bodyParameters?.forEach(p => {
        const mapping = this.triggerConfig.bodyMappings.find(m => m.key === p.key);
        formBody.push(this.createFormGroup(p, !this.allowEdit, mapping));
      });
    } else {
      this.triggerDef.urlParameters?.forEach(p => {
        formUrl.push(this.createFormGroup(p));
      });
      this.triggerDef.headersParameters?.forEach(p => {
        formHeader.push(this.createFormGroup(p));
      });
      this.triggerDef.bodyParameters?.forEach(p => {
        formBody.push(this.createFormGroup(p));
      });
    }

    this.fetchSelections();

    this.updateParamVisible(formUrl);
    this.updateParamVisible(formHeader);
    this.updateParamVisible(formBody);

    this.formTriggerConfig = this.fb.group({
      urlMappings: formUrl,
      headersMappings: formHeader,
      bodyMappings: formBody
    });

    this.connector = new Connector(this.triggerDef.connector);
    if (this.connector.mustToSetAuthInfo || this.connector.mustToSetParam) {
      if (this.triggerConfig) {
        this.connectorConfigInvalid = false;
      } else {
        this.connectorConfigInvalid = true;
      }
    }

    this.emitValue();
    this.formTriggerConfig.valueChanges.subscribe(() => {
      this.emitValue();
    });
  }

  override createFormGroup(param: BodyParameter, readonly: boolean = false, mapping?: Mapping): UntypedFormGroup {
    let form: UntypedFormGroup;
    const defaultKey = Object.keys(this.defaultParam).find(k => k == param.key);
    if (defaultKey) {
      const defaultValue: ExpressionTree = {
        type: `value - ${param.dataType}`,
        value: this.defaultParam[defaultKey]
      };
      form = this.fb.group({
        arrayItemDataType: param.arrayItemDataType,
        dataType: param.dataType,
        defaultValueTree: defaultValue,
        expressionTree: defaultValue,
        isOptional: param.isOptional,
        key: param.key,
        title: param.title,
        renderDirective: param.renderDirective,
        visible: !this.hideDefaultParam,
        readonly: true
      });
    } else {
      form = super.createFormGroup(param, readonly, mapping);
    }
    if (param.renderDirective?.valueListUuid) {
      this.addDtsToArr(param.renderDirective?.valueListUuid);
    }
    return form;
  }

  emitValue() {
    this.showOptionalSection =
      this.formTriggerConfig.value.urlMappings.some(p => p.isOptional && p.visible) ||
      this.formTriggerConfig.value.headersMappings.some(p => p.isOptional && p.visible) ||
      this.formTriggerConfig.value.bodyMappings.some(p => p.isOptional && p.visible);
    this.showParameters =
      this.formTriggerConfig.value.urlMappings.length > 0 ||
      this.formTriggerConfig.value.headersMappings.length > 0 ||
      this.formTriggerConfig.value.bodyMappings.length > 0;

    const data = cloneDeep(this.formTriggerConfig.value);
    if (data?.bodyMappings && data.bodyMappings.length) {
      data.bodyMappings.forEach(item => {
        if (item.dataType === 'array') {
          const argumentsTree: ExpressionTree[] = [];
          item.arrayItemsMappings?.forEach(exp => {
            if (exp.expressionTree?.type !== SubTypeVariable.NullExp && exp.expressionTree != null) {
              argumentsTree.push(exp.expressionTree);
            }
          });
          item.expressionTree = <ExpressionTree>{
            type: SubTypeVariable.ArrayOfValuesExp,
            arguments: argumentsTree
          };
          delete item.arrayItemsMappings;
        }
      });
    }

    data.urlMappings = data.urlMappings.map(item => {
      return { key: item.key, expressionTree: item.expressionTree };
    });
    data.headersMappings = data.headersMappings.map(item => {
      return { key: item.key, expressionTree: item.expressionTree };
    });
    data.bodyMappings = data.bodyMappings.map(item => {
      return {
        key: item.key,
        expressionTree: item.hidden
          ? item.expressionTree
          : item.visible
          ? item.expressionTree
          : { type: SubTypeVariable.NullExp }
      };
    });

    const req: TriggerBaUserReq = {
      defUuid: this.triggerDef.uuid,
      config: data,
      connectorConfig: this.connectorConfig
    };
    this.invalid.emit(this.connectorConfigInvalid || this.formTriggerConfig.invalid);
    this.changeConfigs.emit(req);
  }
}
