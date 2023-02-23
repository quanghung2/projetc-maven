import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { FiFlowSharedModule } from '../../../../shared/src/lib/fi-flow-shared.module';
import { ActionDefComponent } from './action-def/action-def.component';
import { ConnectorDetailComponent } from './connector-detail/connector-detail.component';
import { ConnectorDialogComponent } from './connector-dialog/connector-dialog.component';
import { CreateDefinitionDialogComponent } from './create-definition-dialog/create-definition-dialog.component';
import { DataSourceComponent } from './data-source/data-source.component';
import { ParameterDatasourceComponent } from './data-source/parameter/parameter.component';
import { DefinitionErrorDialogComponent } from './definition-error-dialog/definition-error-dialog.component';
import { ListConnectorComponent } from './list-connector/list-connector.component';
import { MainComponent } from './main/main.component';
import { SettingComponent } from './setting/setting.component';
import { ExtractJsonPropComponent } from './shared-def/extract-json-prop/extract-json-prop.component';
import { FillParametersComponent } from './shared-def/fill-parameters/fill-parameters.component';
import { SharedDefComponent } from './shared-def/shared-def.component';
import { EditDefGeneralDialogComponent } from './table-definition/edit-def-general-dialog/edit-def-general-dialog.component';
import { TableDefinitionComponent } from './table-definition/table-definition.component';
import { TriggerLinkDialogComponent } from './table-definition/trigger-link-dialog/trigger-link-dialog.component';
import { TriggerDefComponent } from './trigger-def/trigger-def.component';
import { VisibilityDomainComponent } from './visibility-domain/visibility-domain.component';

const routes: Route[] = [
  {
    path: '',
    component: SettingComponent,
    children: [
      { path: '', component: MainComponent },
      { path: 'connector/:uuid', component: ConnectorDetailComponent }
    ]
  }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), FiFlowSharedModule],
  declarations: [
    SettingComponent,
    MainComponent,

    ListConnectorComponent,
    ConnectorDialogComponent,
    ConnectorDetailComponent,

    TableDefinitionComponent,
    CreateDefinitionDialogComponent,

    SharedDefComponent,
    ExtractJsonPropComponent,
    TriggerDefComponent,
    ActionDefComponent,
    DataSourceComponent,

    DefinitionErrorDialogComponent,
    EditDefGeneralDialogComponent,
    TriggerLinkDialogComponent,
    VisibilityDomainComponent,
    FillParametersComponent,
    ParameterDatasourceComponent
  ]
})
export class FiFlowFeatureSettingModule {}
