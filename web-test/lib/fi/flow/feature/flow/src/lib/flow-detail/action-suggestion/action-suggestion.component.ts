import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import {
  Action,
  ActionDef,
  ActionType,
  BuiltInActionDef,
  BuiltInActionDefQuery,
  Connector,
  ConnectorQuery,
  ConnectorReq,
  Flow,
  FlowQuery,
  FlowService,
  UserQuery
} from '@b3networks/api/flow';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { cloneDeep } from 'lodash';
import { combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-action-suggestion',
  templateUrl: './action-suggestion.component.html',
  styleUrls: ['./action-suggestion.component.scss']
})
export class ActionSuggestionComponent extends DestroySubscriberComponent implements OnInit {
  @Input() actionUuid: string;
  @Input() action: Action;
  @Output() connectorSelected = new EventEmitter<Connector>();
  @ViewChild(MatMenuTrigger, { static: false }) trigger: MatMenuTrigger;

  flow: Flow;
  connectors: Connector[] = [];
  params: ConnectorReq;
  actionDefSelected: ActionDef;
  builtInActionDefs: BuiltInActionDef[];
  tokens: string[];
  actionDefSubroutineReturn: ActionDef;

  constructor(
    private dialog: MatDialog,
    private connectorQuery: ConnectorQuery,
    private flowService: FlowService,
    private flowQuery: FlowQuery,
    private userQuery: UserQuery,
    private builtInActionDefQuery: BuiltInActionDefQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.builtInActionDefQuery
      .selectAll()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(builtInActionDefs => {
        this.builtInActionDefs = builtInActionDefs;
      });

    combineLatest([this.flowQuery.select(), this.connectorQuery.selectAll({ filterBy: c => c.actionDefs.length > 0 })])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([flow, connectors]) => {
        this.flow = flow;
        if (this.flow.ui.actionSelected) {
          switch (this.flow.ui.actionSelected.actionUuid) {
            case 'TRIGGER_ID':
              this.tokens = this.flow.ui.usableInjectionTokensList.find(u => u.previousActionUuid === null).tokens;
              break;
            case 'PATH_ID':
              this.tokens = this.flow.ui.usableInjectionTokensList.find(
                u => u.previousActionUuid === this.flow.ui.breadcrumb[this.flow.ui.breadcrumb.length - 1].actionUuid
              ).tokens;
              break;
            default:
              this.tokens = this.flow.ui.usableInjectionTokensList.find(
                u => u.previousActionUuid === this.flow.ui.actionSelected.actionUuid
              ).tokens;
              break;
          }

          const filteredConnectors = [this.builtInConnector(), ...cloneDeep(connectors)];
          const subroutineReturn = this.getBuiltInActionDef(ActionType.SUBROUTINE_RETURN);
          this.actionDefSubroutineReturn = <ActionDef>{
            uuid: ActionType.SUBROUTINE_RETURN,
            name: 'Return to Origin Flow',
            outputs: subroutineReturn?.outputs || [],
            description: subroutineReturn?.description,
            inputAutoInjectionTokens: []
          };
          filteredConnectors.forEach(c => {
            if (c.type === 'SUBROUTINE') {
              c.actionDefs.push(this.actionDefSubroutineReturn);
            }
            c.actionDefs = c.actionDefs.filter(a => !this.invalidAction(a));
          });

          const connectorDefault = new Connector({
            actionDefs: [
              <ActionDef>{
                uuid: ActionType.EXTERNAL,
                name: 'External Action',
                outputs: [],
                description: '',
                inputAutoInjectionTokens: []
              }
            ]
          });
          this.connectors = [...filteredConnectors, this.memoryConnector(), connectorDefault];
        }
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

  setActionSelected() {
    if (this.checkLimitResource()) {
      if (this.action) {
        this.flowService.setActionSelected(this.action);
      } else {
        this.flowService.setActionSelected(<Action>{
          actionUuid: this.actionUuid
        });
      }
    } else {
      this.trigger.closeMenu();
    }
  }

  selectedActionDef(connector: Connector, actionDef: ActionDef) {
    if (!this.flow.editable || this.invalidAction(actionDef)) {
      return;
    }
    if (this.actionDefSelected?.uuid === actionDef.uuid) {
      this.unSelectConnectorAndActionDef();
      return;
    }

    this.actionDefSelected = actionDef;

    const connectorFilter = cloneDeep(connector);
    connectorFilter.actionDefs = connectorFilter.actionDefs.filter(item => item.uuid === actionDef.uuid);
    this.connectorSelected.emit(connectorFilter);
  }

  unSelectConnectorAndActionDef() {
    this.actionDefSelected = null;
    this.connectorSelected.emit(null);
  }

  invalidAction(actionDef: ActionDef) {
    if (!this.flow.ui.actionSelected || !this.flow.ui.usableInjectionTokensList) {
      return true;
    } else {
      if (
        (actionDef.uuid == ActionType.SUBROUTINE_RETURN &&
          this.flow.ui.actions.length &&
          this.flow.ui.actionSelected.actionUuid !==
            this.flow.ui.actions[this.flow.ui.actions.length - 1].actionUuid) ||
        (actionDef.inputAutoInjectionTokens.length > 0 &&
          actionDef.inputAutoInjectionTokens.some(t => this.tokens.indexOf(t) === -1))
      ) {
        return true;
      }
    }
    return false;
  }

  private checkLimitResource(): boolean {
    const maxActionsPerFlow = this.userQuery.getValue().actionsPerFlowLimit;
    if (!maxActionsPerFlow) {
      return true;
    } else {
      const totalActions = this.flowQuery.getValue().ui.totalActions;
      if (totalActions > maxActionsPerFlow) {
        this.dialog.open(ConfirmDialogComponent, {
          width: '500px',
          data: <ConfirmDialogInput>{
            title: `Unable to add action. Limit exceeded`,
            message: `You have exceeded the maximum ${maxActionsPerFlow} actions per flow limit. Please remove some other actions to proceed.`,
            confirmLabel: 'Close',
            color: 'primary',
            hideCancel: true
          }
        });
        return false;
      } else {
        return true;
      }
    }
  }

  private getBuiltInActionDef(type: ActionType) {
    return this.builtInActionDefs.find(i => i.type == type);
  }

  private builtInConnector() {
    const switching = this.getBuiltInActionDef(ActionType.SWITCHING);
    const transform = this.getBuiltInActionDef(ActionType.TRANSFORM);
    const loopingAction = this.getBuiltInActionDef(ActionType.LOOPING_ACTION);
    // const constants = this.getBuiltInActionDef(ActionType.DEFINE_CONSTANTS);

    const builtInConnector = new Connector({
      name: 'Built-in Actions',
      actionDefs: [
        <ActionDef>{
          uuid: ActionType.SWITCHING,
          name: 'Split Flow',
          outputs: switching?.outputs || [],
          description: switching?.description,
          inputAutoInjectionTokens: []
        },
        <ActionDef>{
          uuid: ActionType.TRANSFORM,
          name: 'Transform',
          outputs: transform?.outputs || [],
          description: transform?.description,
          inputAutoInjectionTokens: []
        },
        <ActionDef>{
          uuid: ActionType.LOOPING_ACTION,
          name: 'Iterate over a List',
          outputs: loopingAction?.outputs || [],
          description: loopingAction?.description,
          inputAutoInjectionTokens: []
        }
        // <ActionDef>{
        //   uuid: ActionType.DEFINE_CONSTANTS,
        //   name: 'Set Custom Parameters',
        //   outputs: constants?.outputs || [],
        //   description: constants?.description,
        //   inputAutoInjectionTokens: []
        // },
      ],
      needToSetAuthInfo: false,
      type: 'BUILT_IN'
    });
    return builtInConnector;
  }

  private memoryConnector() {
    const setSharedVariable = this.getBuiltInActionDef(ActionType.SET_SHARED_VARIABLE);
    const getSharedVariable = this.getBuiltInActionDef(ActionType.GET_SHARED_VARIABLE);
    const incrementSharedVariable = this.getBuiltInActionDef(ActionType.INCREMENT_SHARED_VARIABLE);
    const pushSharedVariable = this.getBuiltInActionDef(ActionType.PUSH_SHARED_VARIABLE);
    const popSharedVariable = this.getBuiltInActionDef(ActionType.POP_SHARED_VARIABLE);

    const memoryConnector = new Connector({
      name: 'Memory',
      actionDefs: [
        <ActionDef>{
          uuid: ActionType.SET_SHARED_VARIABLE,
          name: 'Save to Memory',
          outputs: setSharedVariable?.outputs || [],
          description: setSharedVariable?.description,
          inputAutoInjectionTokens: []
        },
        <ActionDef>{
          uuid: ActionType.GET_SHARED_VARIABLE,
          name: 'Get from Memory',
          outputs: getSharedVariable?.outputs || [],
          description: getSharedVariable?.description,
          inputAutoInjectionTokens: []
        },
        <ActionDef>{
          uuid: ActionType.INCREMENT_SHARED_VARIABLE,
          name: 'Increase memory value by 1',
          outputs: incrementSharedVariable?.outputs || [],
          description: incrementSharedVariable?.description,
          inputAutoInjectionTokens: []
        },
        <ActionDef>{
          uuid: ActionType.PUSH_SHARED_VARIABLE,
          name: 'Add to Memory List',
          outputs: pushSharedVariable?.outputs || [],
          description: pushSharedVariable?.description,
          inputAutoInjectionTokens: []
        },
        <ActionDef>{
          uuid: ActionType.POP_SHARED_VARIABLE,
          name: 'Get from Memory List',
          outputs: popSharedVariable?.outputs || [],
          description: popSharedVariable?.description,
          inputAutoInjectionTokens: []
        }
      ],
      needToSetAuthInfo: false,
      type: 'MEMORY'
    });
    return memoryConnector;
  }
}
