import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import {
  ActionDef,
  ActionType,
  AuthenticationType,
  BuiltInActionDef,
  BuiltInActionDefQuery,
  Connector,
  ConnectorQuery,
  ConnectorReq,
  ConnectorService,
  ConnectorSuggestionReq,
  Flow,
  FlowQuery
} from '@b3networks/api/flow';
import { AppName, AppStateQuery } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { map, takeUntil } from 'rxjs/operators';
import {
  SetConnectorConfigDialogComponent,
  SetConnectorConfigDialogInput
} from './set-connector-config-dialog/set-connector-config-dialog.component';

type ConnectorCallBack = (connector: Connector[]) => void;

@Component({
  selector: 'b3n-sidebar-suggestion',
  templateUrl: './sidebar-suggestion.component.html',
  styleUrls: ['./sidebar-suggestion.component.scss']
})
export class SidebarSuggestionComponent extends DestroySubscriberComponent implements OnInit {
  @Output() connectorSelected = new EventEmitter<Connector>();

  showForApp: AppName;
  searchConnector = new UntypedFormControl('');
  connectorsSuggestions: Connector[] = [];
  connectors: Connector[] = [];
  params: ConnectorSuggestionReq;
  actionDefSelected: ActionDef;
  builtInActionDefs: BuiltInActionDef[];
  flow: Flow;
  actionDefWhenHover: ActionDef;

  constructor(
    private connectorQuery: ConnectorQuery,
    private activatedRoute: ActivatedRoute,
    private appStateQuery: AppStateQuery,
    private flowQuery: FlowQuery,
    private connectorService: ConnectorService,
    private toastService: ToastService,
    private builtInActionDefQuery: BuiltInActionDefQuery,
    private dialog: MatDialog
  ) {
    super();
  }

  ngOnInit(): void {
    this.showForApp = this.appStateQuery.getName();

    this.builtInActionDefQuery
      .selectAll()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(builtInActionDefs => {
        this.builtInActionDefs = builtInActionDefs;
      });

    this.flowQuery
      .select()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(flow => {
        this.flow = flow;
      });

    this.activatedRoute.params.subscribe(params => {
      this.params = <ConnectorSuggestionReq>params;
      this.connectorService.getConnectorsSuggestion(this.params).subscribe();
    });

    this.connectorQuery
      .select(state => state?.ui?.connectorsSuggestion)
      .pipe(
        map(item => item || []),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(connectorsSuggestion => {
        this.connectorsSuggestions = [this.builtInConnector(), ...connectorsSuggestion];
        const uuids: string[] = this.connectorsSuggestions.map(item => item.uuid);
        this.connectorQuery
          .selectAll()
          .pipe(takeUntil(this.destroySubscriber$))
          .subscribe(connectors => {
            this.connectors = cloneDeep(connectors).filter(item => uuids.indexOf(item.uuid) === -1);
          });
      });

    this.searchConnector.valueChanges.subscribe(value => {
      const connectorsOrigin = this.connectorQuery.getAll();
      const uuids: string[] = this.connectorsSuggestions.map(item => item.uuid);
      this.connectors = cloneDeep(connectorsOrigin).filter(
        cnt => uuids.indexOf(cnt.uuid) === -1 && cnt.name?.toLowerCase()?.indexOf(value?.toLowerCase()) !== -1
      );
    });

    // only using with case reset actionDefSelected and connectorSelected to null
    this.connectorQuery
      .select(item => item.ui)
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(res => {
        this.actionDefSelected = res?.actionDefSelected;
        this.connectorSelected.emit(res?.connectorSelected);
      });
  }

  onCloseMenu() {
    setTimeout(() => {
      this.searchConnector.setValue('');
    }, 200);
  }

  selectedActionDef(connector: Connector, actionDef: ActionDef) {
    if (!this.flow.editable || this.invalidAction(actionDef)) {
      return;
    }
    if (this.actionDefSelected?.uuid === actionDef.uuid) {
      this.unSelectConnectorAndActionDef();
      return;
    }
    if (this.showForApp === AppName.FLOW && (connector.needToSetAuthInfo || connector.needToSetParam)) {
      this.showConfigurationConnector(connector, false, actionDef);
    } else {
      this.actionDefSelected = actionDef;

      const connectorFilter = cloneDeep(connector);
      connectorFilter.actionDefs = connectorFilter.actionDefs.filter(item => item.uuid === actionDef.uuid);
      this.connectorSelected.emit(connectorFilter);
    }
  }

  unSelectConnectorAndActionDef() {
    this.actionDefSelected = null;
    this.connectorSelected.emit(null);
  }

  addConnector(event, connector: Connector) {
    if (event) {
      event.stopPropagation();
    }
    switch (this.showForApp) {
      case AppName.FLOW:
        if (connector.needToSetAuthInfo || connector.needToSetParam) {
          this.showConfigurationConnector(connector, true);
        } else {
          this.addConnectorSuggestion(connector);
        }
        break;
      case AppName.BUSINESS_ACTION_CREATOR:
        this.addConnectorSuggestion(connector);
        break;
    }
  }

  showConfigurationConnector(connector: Connector, isAddConnector: boolean, actionDef?: ActionDef) {
    this.dialog
      .open(SetConnectorConfigDialogComponent, {
        width: '500px',
        panelClass: 'fif-dialog',
        disableClose: true,
        data: <SetConnectorConfigDialogInput>{ connector: connector, isEdit: !isAddConnector }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          if (isAddConnector) {
            this.addConnectorSuggestion(connector);
          } else {
            this.reloadConnectorSuggestion(connectorSuggestion => {
              if (connectorSuggestion) {
                const connectorFilter = cloneDeep(connectorSuggestion).find(item => item.uuid === connector.uuid);
                if (connectorFilter) {
                  connectorFilter.actionDefs = connectorFilter.actionDefs?.filter(item => item.uuid === actionDef.uuid);
                  this.actionDefSelected = actionDef;
                  this.connectorSelected.emit(connectorFilter);
                }
              }
            });
          }
        }
      });
  }

  addConnectorSuggestion(connector: Connector) {
    const request = <ConnectorSuggestionReq>{
      flowUuid: this.params.flowUuid,
      version: this.params.version,
      connectorUuid: connector.uuid
    };
    this.connectorService.addConnectorsToSuggestion(request).subscribe({
      next: () => {
        this.reloadConnectorSuggestion();
        this.toastService.success('Add connector successfully!');
      },
      error: () => this.toastService.error('Add connector failed')
    });
  }

  removeConnector(connector: Connector) {
    const request = <ConnectorSuggestionReq>{
      flowUuid: this.params.flowUuid,
      version: this.params.version,
      connectorUuid: connector.uuid
    };
    this.connectorService.removeConnectors(request).subscribe({
      next: () => {
        this.reloadConnector(this.params.flowUuid, this.params.version);
        this.reloadConnectorSuggestion();
        this.toastService.success('Remove connector successfully!');
      },
      error: () => this.toastService.error('Remove connector failed')
    });
  }

  reloadConnectorSuggestion(resolve: ConnectorCallBack = () => {}) {
    this.connectorService.getConnectorsSuggestion(this.params).subscribe(connectorsSuggestion => {
      const connectorsSuggestions = [this.builtInConnector(), ...connectorsSuggestion].filter(x => x);
      resolve(connectorsSuggestions);
    });
  }

  onCloseInformationMenu() {
    this.actionDefWhenHover = null;
  }

  isShowSetConfigConnector(connector: Connector) {
    return (
      this.showForApp === AppName.FLOW &&
      connector.type !== 'BUILT_IN' &&
      ((connector.authenticationType && connector.authenticationType !== AuthenticationType.NO_AUTH) ||
        connector.userParams.length)
    );
  }

  setConfig(connector: Connector) {
    this.dialog
      .open(SetConnectorConfigDialogComponent, {
        width: '500px',
        panelClass: 'fif-dialog',
        disableClose: true,
        autoFocus: false,
        data: <SetConnectorConfigDialogInput>{ connector: connector, isEdit: true }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.reloadConnectorSuggestion();
        }
      });
  }

  invalidAction(actionDef: ActionDef) {
    if (this.flow.ui.actionSelected) {
      if (
        actionDef.uuid == ActionType.SUBROUTINE_RETURN &&
        this.flow.ui.actions.length &&
        this.flow.ui.actionSelected.actionUuid !== this.flow.ui.actions[this.flow.ui.actions.length - 1].actionUuid
      ) {
        return true;
      }
    }
    return false;
  }

  private reloadConnector(flowUuid: string, version: number) {
    const request = <ConnectorReq>{
      flowVersion: version,
      flowUuid: flowUuid
    };
    this.connectorService.getConnectors(request, false).subscribe();
  }

  private getBuiltInActionDef(type: ActionType) {
    return this.builtInActionDefs.find(i => i.type == type);
  }

  private builtInConnector() {
    const switching = this.getBuiltInActionDef(ActionType.SWITCHING);
    const transform = this.getBuiltInActionDef(ActionType.TRANSFORM);
    const constants = this.getBuiltInActionDef(ActionType.DEFINE_CONSTANTS);
    const setSharedVariable = this.getBuiltInActionDef(ActionType.SET_SHARED_VARIABLE);
    const getSharedVariable = this.getBuiltInActionDef(ActionType.GET_SHARED_VARIABLE);
    const incrementSharedVariable = this.getBuiltInActionDef(ActionType.INCREMENT_SHARED_VARIABLE);
    const pushSharedVariable = this.getBuiltInActionDef(ActionType.PUSH_SHARED_VARIABLE);
    const popSharedVariable = this.getBuiltInActionDef(ActionType.POP_SHARED_VARIABLE);
    const loopingAction = this.getBuiltInActionDef(ActionType.LOOPING_ACTION);
    const subroutineReturn = this.getBuiltInActionDef(ActionType.SUBROUTINE_RETURN);

    const builtInConnector = new Connector({
      name: 'Built-in Actions',
      iconUrl: 'assets/flow-shared/icons/miscellaneous_services.svg',
      actionDefs: [
        <ActionDef>{
          uuid: ActionType.SWITCHING,
          name: 'Split Flow',
          outputs: switching?.outputs || [],
          description: switching?.description
        },
        <ActionDef>{
          uuid: ActionType.TRANSFORM,
          name: 'Transform',
          outputs: transform?.outputs || [],
          description: transform?.description
        },
        <ActionDef>{
          uuid: ActionType.DEFINE_CONSTANTS,
          name: 'Set Custom Parameters',
          outputs: constants?.outputs || [],
          description: constants?.description
        },
        <ActionDef>{
          uuid: ActionType.SET_SHARED_VARIABLE,
          name: 'Save to Memory',
          outputs: setSharedVariable?.outputs || [],
          description: setSharedVariable?.description
        },
        <ActionDef>{
          uuid: ActionType.GET_SHARED_VARIABLE,
          name: 'Get from Memory',
          outputs: getSharedVariable?.outputs || [],
          description: getSharedVariable?.description
        },
        <ActionDef>{
          uuid: ActionType.INCREMENT_SHARED_VARIABLE,
          name: 'Increase memory value by 1',
          outputs: incrementSharedVariable?.outputs || [],
          description: incrementSharedVariable?.description
        },
        <ActionDef>{
          uuid: ActionType.PUSH_SHARED_VARIABLE,
          name: 'Add to Memory List',
          outputs: pushSharedVariable?.outputs || [],
          description: pushSharedVariable?.description
        },
        <ActionDef>{
          uuid: ActionType.POP_SHARED_VARIABLE,
          name: 'Get from Memory List',
          outputs: popSharedVariable?.outputs || [],
          description: popSharedVariable?.description
        },
        <ActionDef>{
          uuid: ActionType.LOOPING_ACTION,
          name: 'Iterate over a List',
          outputs: loopingAction?.outputs || [],
          description: loopingAction?.description
        }
      ],
      needToSetAuthInfo: false,
      type: 'BUILT_IN'
    });
    if (this.flow?.type === 'SUBROUTINE') {
      builtInConnector.actionDefs.push(<ActionDef>{
        uuid: ActionType.SUBROUTINE_RETURN,
        name: 'Return to Origin Flow',
        outputs: subroutineReturn?.outputs || [],
        description: subroutineReturn?.description
      });
    }

    return builtInConnector;
  }
}
