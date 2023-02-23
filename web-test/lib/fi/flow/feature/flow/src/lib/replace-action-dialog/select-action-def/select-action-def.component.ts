import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import {
  Action,
  ActionDef,
  ActionType,
  BuiltInActionDef,
  BuiltInActionDefQuery,
  Connector,
  ConnectorQuery,
  ConnectorService,
  ConnectorSuggestionReq,
  Flow,
  FlowQuery,
  PrerequisiteQuery
} from '@b3networks/api/flow';
import { AppName, AppStateQuery } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { cloneDeep } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-select-action-def',
  templateUrl: './select-action-def.component.html',
  styleUrls: ['./select-action-def.component.scss']
})
export class SelectActionDefComponent extends DestroySubscriberComponent implements OnInit {
  @Input() currentAction: Action;
  @Output() configInvalid = new EventEmitter<boolean>();
  @Output() changeActionDef = new EventEmitter<ActionDef>();

  AppName = AppName;
  showForApp: string;
  flow: Flow;
  invalidConnectors: string[];
  builtInActionDefs: BuiltInActionDef[];
  connectors: Connector[];
  builtInConnector: Connector;
  memoryConnector: Connector;
  selectedConnector: Connector;
  searchConnectorCtrl = new UntypedFormControl();

  filteredConnectors$: Observable<Connector[]>;
  connectorCtrl = new UntypedFormControl('', Validators.required);
  filteredActionDefs: ActionDef[];
  searchActionDefCtrl = new UntypedFormControl();
  actionDefCtrl = new UntypedFormControl({ value: '', disabled: true }, Validators.required);

  getErrorConnector = () => (this.connectorCtrl.hasError('required') ? 'Please select connector' : '');
  compareConnector(p1: Connector, p2: Connector): boolean {
    return !p1 || !p2 ? false : p1.uuid === p2.uuid;
  }
  getErrorActionDef = () => (this.actionDefCtrl.hasError('required') ? 'Please select action' : '');
  compareActionDef(p1: ActionDef, p2: ActionDef): boolean {
    return !p1 || !p2 ? false : p1.uuid === p2.uuid;
  }

  constructor(
    private appStateQuery: AppStateQuery,
    private connectorQuery: ConnectorQuery,
    private flowQuery: FlowQuery,
    private builtInActionDefQuery: BuiltInActionDefQuery,
    private prerequisiteQuery: PrerequisiteQuery,
    private connectorService: ConnectorService
  ) {
    super();
  }

  ngOnInit(): void {
    this.showForApp = this.appStateQuery.getName();
    this.flow = this.flowQuery.getValue();

    combineLatest([
      this.prerequisiteQuery.select(),
      this.builtInActionDefQuery.selectAll(),
      this.connectorQuery.select(state => state?.ui?.connectorsSuggestion),
      this.connectorQuery.selectAll({ filterBy: c => c.actionDefs?.length > 0 })
    ])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([prerequisite, builtInActionDefs, connectorsSuggestion, simpleAppConnectors]) => {
        this.invalidConnectors = prerequisite.invalidConnectors;
        this.builtInActionDefs = builtInActionDefs;
        this.builtInConnector = this.createBuiltInConnector();
        this.memoryConnector = this.createMemoryConnector();

        if (this.showForApp === AppName.PROGRAMMABLE_FLOW) {
          this.actionDefCtrl.enable();
          this.actionDefCtrl.setValue('');

          const tokens = this.flow.ui.usableInjectionTokensList.find(
            u => u.previousActionUuid === this.currentAction.prevActionUuid
          ).tokens;

          const filteredConnectors = cloneDeep(simpleAppConnectors);
          filteredConnectors.forEach(c => {
            c.actionDefs = c.actionDefs.filter(a => !this.invalidAction(a, tokens));
          });
          this.mergeConnectors(filteredConnectors);
        } else {
          if (connectorsSuggestion) {
            this.mergeConnectors(connectorsSuggestion);
          } else {
            this.connectorService
              .getConnectorsSuggestion(<ConnectorSuggestionReq>{
                flowUuid: this.flow.uuid,
                version: this.flow.version
              })
              .subscribe(res => {
                this.mergeConnectors(res);
              });
          }
        }
      });

    this.connectorCtrl.valueChanges.subscribe((connector: Connector) => {
      this.actionDefCtrl.enable();
      this.actionDefCtrl.setValue('');
      this.selectedConnector = connector;

      switch (connector.type) {
        case 'BUILT_IN':
          this.searchActionDefCtrl.valueChanges.pipe(startWith('')).subscribe(val => {
            this.filteredActionDefs = this.builtInConnector.actionDefs.filter(
              a => a.name.toLowerCase().indexOf(val.toLowerCase()) >= 0 && a.uuid !== this.currentAction.type
            );
          });
          break;
        case 'CUSTOM':
          if (this.currentAction.type !== ActionType.EXTERNAL) {
            this.filteredActionDefs = [connector.actionDefs[0]];
            this.actionDefCtrl.setValue(connector.actionDefs[0]);
          } else {
            this.filteredActionDefs.length = 0;
          }
          break;
        default: {
          const connectorUuid = this.selectedConnector.uuid;
          this.connectorService
            .getActionDefs(connectorUuid)
            .pipe(takeUntil(this.destroySubscriber$))
            .subscribe(actionDefs => {
              this.searchActionDefCtrl.valueChanges.pipe(startWith('')).subscribe(val => {
                const subroutineUuid = this.flow.uuid;
                let filteredActionDefs = actionDefs.filter(
                  a => a.name.toLowerCase().indexOf(val.toLowerCase()) >= 0 && a.subroutineUuid !== subroutineUuid
                );
                if (this.currentAction.actionDef) {
                  filteredActionDefs = filteredActionDefs.filter(
                    a => a.uuid !== this.currentAction.actionDef.actionDefUuid
                  );
                }
                this.filteredActionDefs = filteredActionDefs;
              });
            });
          break;
        }
      }
    });

    this.actionDefCtrl.valueChanges.subscribe((actionDef: ActionDef) => {
      this.changeActionDef.emit(actionDef);
    });
  }

  private mergeConnectors(connectors: Connector[]) {
    const connectorDefault = new Connector({
      name: 'External Action',
      iconUrl: 'assets/flow-shared/icons/api.svg',
      actionDefs: [
        <ActionDef>{
          uuid: ActionType.EXTERNAL,
          name: 'External Action',
          iconUrl: 'assets/flow-shared/icons/api.svg',
          outputs: [],
          description: '',
          inputAutoInjectionTokens: []
        }
      ],
      type: 'CUSTOM'
    });

    this.connectors = [this.builtInConnector, ...connectors];
    if (this.showForApp === AppName.PROGRAMMABLE_FLOW) {
      this.connectors = [...this.connectors, this.memoryConnector];
    }
    if (this.currentAction.type !== ActionType.EXTERNAL) {
      this.connectors = [...this.connectors, connectorDefault];
    }

    this.filteredConnectors$ = this.searchConnectorCtrl.valueChanges.pipe(
      startWith(''),
      map(val => {
        return this.connectors.filter(c => c.name.toLowerCase().indexOf(val.toLowerCase()) >= 0);
      })
    );
  }

  private getBuiltInActionDef(type: ActionType) {
    return this.builtInActionDefs.find(i => i.type == type);
  }

  private createBuiltInConnector() {
    const switching = this.getBuiltInActionDef(ActionType.SWITCHING);
    const transform = this.getBuiltInActionDef(ActionType.TRANSFORM);
    const loopingAction = this.getBuiltInActionDef(ActionType.LOOPING_ACTION);
    const constants = this.getBuiltInActionDef(ActionType.DEFINE_CONSTANTS);
    // const subroutineReturn = this.getBuiltInActionDef(ActionType.SUBROUTINE_RETURN);

    const builtInConnector = new Connector({
      name: 'Built-in Actions',
      iconUrl: 'assets/flow-shared/icons/miscellaneous_services.svg',
      actionDefs: [
        <ActionDef>{
          uuid: ActionType.SWITCHING,
          name: 'Split Flow',
          iconUrl: 'assets/flow-shared/icons/brandching.svg',
          outputs: switching?.outputs || [],
          description: switching?.description,
          inputAutoInjectionTokens: []
        },
        <ActionDef>{
          uuid: ActionType.TRANSFORM,
          name: 'Transform',
          iconUrl: 'assets/flow-shared/icons/transform.svg',
          outputs: transform?.outputs || [],
          description: transform?.description,
          inputAutoInjectionTokens: []
        },
        <ActionDef>{
          uuid: ActionType.LOOPING_ACTION,
          name: 'Iterate over a List',
          iconUrl: 'assets/flow-shared/icons/repeat.svg',
          outputs: loopingAction?.outputs || [],
          description: loopingAction?.description,
          inputAutoInjectionTokens: []
        },
        <ActionDef>{
          uuid: ActionType.DEFINE_CONSTANTS,
          name: 'Set Custom Parameters',
          iconUrl: 'assets/flow-shared/icons/library_add.svg',
          outputs: constants?.outputs || [],
          description: constants?.description,
          inputAutoInjectionTokens: []
        }
      ],
      needToSetAuthInfo: false,
      type: 'BUILT_IN'
    });
    // if (this.flow?.type === 'SUBROUTINE') {
    //   builtInConnector.actionDefs.push(<ActionDef>{
    //     uuid: ActionType.SUBROUTINE_RETURN,
    //     name: 'Return to Origin Flow',
    //     iconUrl: 'assets/flow-shared/icons/keyboard_return.svg',
    //     outputs: subroutineReturn?.outputs || [],
    //     description: subroutineReturn?.description,
    //     inputAutoInjectionTokens: []
    //   });
    // }
    if (this.showForApp === AppName.PROGRAMMABLE_FLOW) {
      builtInConnector.actionDefs = builtInConnector.actionDefs.filter(a => a.uuid !== ActionType.DEFINE_CONSTANTS);
    } else {
      const setSharedVariable = this.getBuiltInActionDef(ActionType.SET_SHARED_VARIABLE);
      const getSharedVariable = this.getBuiltInActionDef(ActionType.GET_SHARED_VARIABLE);
      const incrementSharedVariable = this.getBuiltInActionDef(ActionType.INCREMENT_SHARED_VARIABLE);
      const pushSharedVariable = this.getBuiltInActionDef(ActionType.PUSH_SHARED_VARIABLE);
      const popSharedVariable = this.getBuiltInActionDef(ActionType.POP_SHARED_VARIABLE);

      builtInConnector.actionDefs = [
        ...builtInConnector.actionDefs,
        <ActionDef>{
          uuid: ActionType.SET_SHARED_VARIABLE,
          name: 'Save to Memory',
          iconUrl: 'assets/flow-shared/icons/upload.svg',
          outputs: setSharedVariable?.outputs || [],
          description: setSharedVariable?.description,
          inputAutoInjectionTokens: []
        },
        <ActionDef>{
          uuid: ActionType.GET_SHARED_VARIABLE,
          name: 'Get from Memory',
          iconUrl: 'assets/flow-shared/icons/download.svg',
          outputs: getSharedVariable?.outputs || [],
          description: getSharedVariable?.description,
          inputAutoInjectionTokens: []
        },
        <ActionDef>{
          uuid: ActionType.INCREMENT_SHARED_VARIABLE,
          name: 'Increase memory value by 1',
          iconUrl: 'assets/flow-shared/icons/plus_one.svg',
          outputs: incrementSharedVariable?.outputs || [],
          description: incrementSharedVariable?.description,
          inputAutoInjectionTokens: []
        },
        <ActionDef>{
          uuid: ActionType.PUSH_SHARED_VARIABLE,
          name: 'Add to Memory List',
          iconUrl: 'assets/flow-shared/icons/playlist_add.svg',
          outputs: pushSharedVariable?.outputs || [],
          description: pushSharedVariable?.description,
          inputAutoInjectionTokens: []
        },
        <ActionDef>{
          uuid: ActionType.POP_SHARED_VARIABLE,
          name: 'Get from Memory List',
          iconUrl: 'assets/flow-shared/icons/playlist_remove.svg',
          outputs: popSharedVariable?.outputs || [],
          description: popSharedVariable?.description,
          inputAutoInjectionTokens: []
        }
      ];
    }
    return builtInConnector;
  }

  private createMemoryConnector() {
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

  private invalidAction(actionDef: ActionDef, tokens: string[]) {
    if (
      actionDef.inputAutoInjectionTokens.length > 0 &&
      actionDef.inputAutoInjectionTokens.some(t => tokens.indexOf(t) === -1)
    ) {
      return true;
    }

    // if (
    //   (actionDef.uuid == ActionType.SUBROUTINE_RETURN &&
    //     this.flow.actions.length &&
    //     this.flow.actionSelected.actionUuid !== this.flow.actions[this.flow.actions.length - 1].actionUuid) ||
    //   (actionDef.inputAutoInjectionTokens.length > 0 &&
    //     actionDef.inputAutoInjectionTokens.some(t => tokens.indexOf(t) === -1))
    // ) {
    //   return true;
    // }

    return false;
  }

  showWarning(connectorUuid: string) {
    return this.invalidConnectors?.includes(connectorUuid);
  }
}
