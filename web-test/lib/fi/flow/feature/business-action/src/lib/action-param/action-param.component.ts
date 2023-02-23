import { Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import {
  ActionBaUserReq,
  ActionConfig,
  ActionDef,
  BodyParameter,
  Connector,
  DataSourceService,
  ExpressionTree,
  Mapping,
  SubTypeVariable
} from '@b3networks/api/flow';
import { cloneDeep } from 'lodash';
import { ConnectorConfigComponent } from '../connector-config/connector-config.component';
import { SharedParamComponent } from '../shared/param.component';

@Component({
  selector: 'b3n-action-param',
  templateUrl: './action-param.component.html',
  styleUrls: ['./action-param.component.scss']
})
export class ActionParamComponent extends SharedParamComponent implements OnInit {
  @Input() actionDef: ActionDef;
  @Input() actionConfig: ActionConfig;
  @Input() allowEdit = true;
  @Input() exceptValueOfDts: string;
  @Output() changeConfigs = new EventEmitter<ActionBaUserReq>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() invalid = new EventEmitter<boolean>();
  @ViewChildren('connectorsConfig') connectorsConfig: QueryList<ConnectorConfigComponent>;

  formActionConfig: UntypedFormGroup;
  connectorsToSetConfig: Connector[];
  connectorConfigInvalid = false;

  constructor(fb: UntypedFormBuilder, dataSourceService: DataSourceService) {
    super(fb, dataSourceService);
  }

  ngOnInit(): void {
    const formMapping = this.fb.array([]);

    if (this.actionConfig) {
      this.actionDef.parameters?.forEach(p => {
        const mapping = this.actionConfig.mappings.find(m => m.key === p.key);
        formMapping.push(this.createFormGroup(p, !this.allowEdit, mapping));
      });
    } else {
      this.actionDef.parameters?.forEach(p => {
        formMapping.push(this.createFormGroup(p));
      });
    }

    this.fetchSelections();

    this.updateParamVisible(formMapping);

    this.formActionConfig = this.fb.group({
      mappings: formMapping
    });

    const connectors: Connector[] = [];
    this.actionDef.businessActionRelatedConnectors.forEach(c => {
      connectors.push(new Connector(c));
    });
    this.connectorsToSetConfig = connectors.filter(c => c.mustToSetAuthInfo || c.mustToSetParam);

    this.emitValue();
    this.formActionConfig.valueChanges.subscribe(() => {
      this.emitValue();
    });
  }

  override createFormGroup(param: BodyParameter, readonly: boolean = false, mapping?: Mapping): UntypedFormGroup {
    const form = super.createFormGroup(param, readonly, mapping);
    if (param.renderDirective?.valueListUuid) {
      this.addDtsToArr(param.renderDirective?.valueListUuid);
    }
    return form;
  }

  emitValue() {
    this.showOptionalSection = this.formActionConfig.value.mappings.some(p => p.isOptional && p.visible);
    this.showParameters = this.formActionConfig.value.mappings.length > 0;

    const data = cloneDeep(this.formActionConfig.value);
    if (data?.mappings && data.mappings.length) {
      data.mappings.forEach(item => {
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

    data.mappings = data.mappings.map(item => {
      return {
        key: item.key,
        expressionTree: item.hidden
          ? item.expressionTree
          : item.visible
          ? item.expressionTree
          : { type: SubTypeVariable.NullExp }
      };
    });

    let connectorConfigMap = null;
    if (this.connectorsToSetConfig.length > 0) {
      const formConnectorConfigMap = this.fb.group({});
      this.connectorsConfig?.toArray().forEach(i => {
        formConnectorConfigMap.addControl(
          i.connector.uuid,
          this.fb.group({
            authenticationInfo: i.getAuthValue(),
            userMappings: i.getParamsValue()
          })
        );
      });
      this.connectorConfigInvalid = this.connectorsConfig?.toArray().some(i => i.isInvalid());
      connectorConfigMap = formConnectorConfigMap.value;
    }

    const req: ActionBaUserReq = {
      defUuid: this.actionDef.uuid,
      config: data,
      connectorConfigMap: connectorConfigMap
    };
    this.invalid.emit(this.connectorConfigInvalid || this.formActionConfig.invalid);
    this.changeConfigs.emit(req);
  }
}
