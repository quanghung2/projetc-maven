import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { FiFlowSharedModule } from '../../../../shared/src/lib/fi-flow-shared.module';
import { BaseActionFlowComponent } from './base-action-flow/base-action-flow.component';
import { ConfirmDeleteActionDialogComponent } from './confirm-delete-action-dialog/confirm-delete-action-dialog.component';
import { ConnectorConfigComponent } from './connector-config/connector-config.component';
import { ContextVarMixedComponent } from './context-variable/context-var-mixed/context-var-mixed.component';
import { ContextVariableComponent } from './context-variable/context-variable.component';
import { MenuVariableComponent } from './context-variable/menu-variable/menu-variable.component';
import { RenderDirectiveComponent } from './context-variable/render-directive/render-directive.component';
import { SelectContextVarComponent } from './context-variable/select-context-var/select-context-var.component';
import { CreateTriggerParametersComponent } from './create-trigger-parameters/create-trigger-parameters.component';
import { DefActionApiComponent } from './def-action-api/def-action-api.component';
import { DefActionDefineConstantComponent } from './def-action-define-constant/def-action-define-constant.component';
import { DefActionExternalComponent } from './def-action-external/def-action-external.component';
import { DefActionLoopingComponent } from './def-action-looping/def-action-looping.component';
import { DefActionSharedVariableComponent } from './def-action-shared-variable/def-action-shared-variable.component';
import { DefActionSubroutineCallComponent } from './def-action-subroutine-call/def-action-subroutine-call.component';
import { DefActionSubroutineReturnComponent } from './def-action-subroutine-return/def-action-subroutine-return.component';
import { DefActionSwitchingComponent } from './def-action-switching/def-action-switching.component';
import { DefActionTransformComponent } from './def-action-transform/def-action-transform.component';
import { ActionSuggestionComponent } from './flow-detail/action-suggestion/action-suggestion.component';
import { AddActionDialogComponent } from './flow-detail/add-action-dialog/add-action-dialog.component';
import { BaCreatorComponent } from './flow-detail/ba-creator/ba-creator.component';
import { BreadcrumbComponent } from './flow-detail/breadcrumb/breadcrumb.component';
import { CreateBaCreatorComponent } from './flow-detail/create-trigger-dialog/create-bacreator/create-bacreator.component';
import { CreateSubroutineComponent } from './flow-detail/create-trigger-dialog/create-subroutine/create-subroutine.component';
import { CreateTriggerDialogComponent } from './flow-detail/create-trigger-dialog/create-trigger-dialog.component';
import { ExtendTriggerComponent } from './flow-detail/extend-trigger/extend-trigger.component';
import { FlowDetailComponent } from './flow-detail/flow-detail.component';
import { OverViewTreeComponent } from './flow-detail/overview-tree/overview-tree.component';
import { TreeNodeComponent } from './flow-detail/overview-tree/tree-node/tree-node.component';
import { SelectTriggerComponent } from './flow-detail/select-trigger/select-trigger.component';
import { SharedInputParamComponent } from './flow-detail/shared-input-param/shared-input-param.component';
import { SubroutineComponent } from './flow-detail/subroutine/subroutine.component';
import { UpdateBaCreatorDialogComponent } from './flow-detail/update-bacreator-dialog/update-bacreator-dialog.component';
import { UpdateSubroutineDialogComponent } from './flow-detail/update-subroutine-dialog/update-subroutine-dialog.component';
import { UpdateTriggerDialogComponent } from './flow-detail/update-trigger-dialog/update-trigger-dialog.component';
import { ViewTriggerOutputDialogComponent } from './flow-detail/view-trigger-output-dialog/view-trigger-output-dialog.component';
import { FlowTestingComponent } from './flow-testing/flow-testing.component';
import { TestItemArrayComponent } from './flow-testing/test-item-array/test-item-array.component';
import { FlowComponent } from './flow/flow.component';
import { HeaderFlowComponent } from './header-flow/header-flow.component';
import { EditActionNameComponent } from './list-action/edit-action-name/edit-action-name.component';
import { ListActionComponent } from './list-action/list-action.component';
import { UpdateActionApiDialogComponent } from './list-action/update-action-api-dialog/update-action-api-dialog.component';
import { UpdateActionDefineConstantDialogComponent } from './list-action/update-action-define-constant-dialog/update-action-define-constant-dialog.component';
import { UpdateActionExternalDialogComponent } from './list-action/update-action-external-dialog/update-action-external-dialog.component';
import { UpdateActionLoopingDialogComponent } from './list-action/update-action-looping-dialog/update-action-looping-dialog.component';
import { UpdateActionSharedVariableDialogComponent } from './list-action/update-action-shared-variable-dialog/update-action-shared-variable-dialog.component';
import { UpdateActionSubroutineCallDialogComponent } from './list-action/update-action-subroutine-call-dialog/update-action-subroutine-call-dialog.component';
import { UpdateActionSubroutineReturnDialogComponent } from './list-action/update-action-subroutine-return-dialog/update-action-subroutine-return-dialog.component';
import { UpdateActionSwitchingDialogComponent } from './list-action/update-action-switching-dialog/update-action-switching-dialog.component';
import { UpdateActionTransformDialogComponent } from './list-action/update-action-transform-dialog/update-action-transform-dialog.component';
import { ViewOutputActionDialogComponent } from './list-action/view-output-action-dialog/view-output-action-dialog.component';
import { BaActionComponent } from './list-flow/bac-app/ba-action/ba-action.component';
import { BaRelationshipComponent } from './list-flow/bac-app/ba-relationship/ba-relationship.component';
import { RelationshipDialogComponent } from './list-flow/bac-app/ba-relationship/relationship-dialog/relationship-dialog.component';
import { BacAppComponent } from './list-flow/bac-app/bac-app.component';
import { CreateFlowDialogComponent } from './list-flow/flow-app/create-flow-dialog/create-flow-dialog.component';
import { FifListFlowComponent } from './list-flow/flow-app/list-flow.component';
import { TableFlowComponent } from './list-flow/flow-app/table/table-flow.component';
import { ImportFlowDialogComponent } from './list-flow/import-flow-dialog/import-flow-dialog.component';
import { ListFlowComponent } from './list-flow/list-flow.component';
import { PfListFlowComponent } from './list-flow/pf-app/list-flow.component';
import { ListLogComponent } from './list-log/list-log.component';
import { LogTableComponent } from './list-log/log-table/log-table.component';
import { LogDetailComponent } from './log-detail/log-detail.component';
import { ConfigEventComponent } from './mapped-events/config-event/config-event.component';
import { MappedEventsComponent } from './mapped-events/mapped-events.component';
import { MappingsComponent } from './mappings/mappings.component';
import { OutputActionComponent } from './output-action/output-action.component';
import { RedirectLogDetailComponent } from './redirect-log-detail/redirect-log-detail.component';
import { ReplaceActionDialogComponent } from './replace-action-dialog/replace-action-dialog.component';
import { SelectActionDefComponent } from './replace-action-dialog/select-action-def/select-action-def.component';
import { ReplaceTriggerDialogComponent } from './replace-trigger-dialog/replace-trigger-dialog.component';
import { ResolveDependencyDialogComponent } from './resolve-dependency-dialog/resolve-dependency-dialog.component';
import { ResolveDependencyComponent } from './resolve-dependency/resolve-dependency.component';
import { ResolveDeprecatedComponent } from './resolve-deprecated/resolve-deprecated.component';
import { UpgradeActionDialogComponent } from './resolve-deprecated/upgrade-action-dialog/upgrade-action-dialog.component';
import { SelectPathDialogComponent } from './select-path-dialog/select-path-dialog.component';
import { ActionDefInfoComponent } from './sidebar-suggestion/action-def-info/action-def-info.component';
import { SetConnectorConfigDialogComponent } from './sidebar-suggestion/set-connector-config-dialog/set-connector-config-dialog.component';
import { SidebarSuggestionComponent } from './sidebar-suggestion/sidebar-suggestion.component';
import { UpdateTriggerParametersComponent } from './update-trigger-parameters/update-trigger-parameters.component';

const routes: Route[] = [
  {
    path: '',
    component: FlowComponent,
    children: [
      { path: '', component: ListFlowComponent },
      { path: ':flowUuid/log/:id', component: RedirectLogDetailComponent },
      { path: ':flowUuid/:version', component: FlowDetailComponent },
      { path: ':flowUuid/:version/logs', component: ListLogComponent },
      { path: ':flowUuid/:version/logs/:id', component: LogDetailComponent },
      { path: ':flowUuid/:version/logs/:id/:tab', component: LogDetailComponent },
      { path: ':flowUuid/:version/resolve-deprecated', component: ResolveDeprecatedComponent },
      { path: ':flowUuid/:version/flow-testing', component: FlowTestingComponent },
      { path: ':flowUuid/:version/mapped-events', component: MappedEventsComponent },
      { path: ':flowUuid/:version/mapped-events/:id', component: ConfigEventComponent }
    ]
  }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), FiFlowSharedModule],
  declarations: [
    FlowComponent,

    ListFlowComponent,
    FifListFlowComponent,
    TableFlowComponent,
    BacAppComponent,
    BaActionComponent,
    BaRelationshipComponent,
    RelationshipDialogComponent,
    PfListFlowComponent,
    CreateFlowDialogComponent,
    ImportFlowDialogComponent,

    CreateTriggerParametersComponent,
    UpdateTriggerParametersComponent,
    ReplaceTriggerDialogComponent,
    BaseActionFlowComponent,
    MappingsComponent,
    DefActionApiComponent,
    DefActionExternalComponent,
    DefActionDefineConstantComponent,
    DefActionLoopingComponent,
    DefActionSharedVariableComponent,
    DefActionSubroutineCallComponent,
    DefActionSubroutineReturnComponent,
    DefActionSwitchingComponent,
    DefActionTransformComponent,

    UpdateTriggerDialogComponent,
    UpdateSubroutineDialogComponent,
    UpdateBaCreatorDialogComponent,
    UpdateActionApiDialogComponent,
    UpdateActionExternalDialogComponent,
    UpdateActionDefineConstantDialogComponent,
    UpdateActionLoopingDialogComponent,
    UpdateActionSharedVariableDialogComponent,
    UpdateActionSubroutineCallDialogComponent,
    UpdateActionSubroutineReturnDialogComponent,
    UpdateActionSwitchingDialogComponent,
    UpdateActionTransformDialogComponent,
    EditActionNameComponent,
    ResolveDeprecatedComponent,
    ResolveDependencyComponent,
    ResolveDependencyDialogComponent,

    FlowDetailComponent,
    HeaderFlowComponent,
    SelectTriggerComponent,
    ExtendTriggerComponent,
    CreateTriggerDialogComponent,
    SharedInputParamComponent,
    SubroutineComponent,
    CreateSubroutineComponent,
    BaCreatorComponent,
    CreateBaCreatorComponent,
    SidebarSuggestionComponent,
    ConnectorConfigComponent,
    SetConnectorConfigDialogComponent,
    ActionDefInfoComponent,
    ActionSuggestionComponent,
    OverViewTreeComponent,
    TreeNodeComponent,
    SelectActionDefComponent,
    BreadcrumbComponent,
    ListActionComponent,
    AddActionDialogComponent,
    UpgradeActionDialogComponent,
    ReplaceActionDialogComponent,
    SelectPathDialogComponent,
    ViewOutputActionDialogComponent,
    ViewTriggerOutputDialogComponent,
    OutputActionComponent,
    ConfirmDeleteActionDialogComponent,
    TestItemArrayComponent,
    FlowTestingComponent,
    MappedEventsComponent,
    ConfigEventComponent,
    ListLogComponent,
    RedirectLogDetailComponent,
    LogDetailComponent,
    LogTableComponent,

    ContextVariableComponent,
    MenuVariableComponent,
    ContextVarMixedComponent,
    SelectContextVarComponent,
    RenderDirectiveComponent
  ]
})
export class FiFlowFeatureFlowModule {}
