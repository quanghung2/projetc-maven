import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  ConnectorQuery,
  ConnectorService,
  ConnectorSuggestionReq,
  Flow,
  FlowQuery,
  FlowService,
  GetActionReq,
  SimpleAppFlowService,
  Trigger,
  TriggerConfig,
  TriggerDef,
  TriggerDefQuery,
  TriggerQuery,
  TriggerReq,
  TriggerService
} from '@b3networks/api/flow';
import { AppName, AppStateQuery } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, startWith, takeUntil } from 'rxjs/operators';
import {
  CreateTriggerDialogComponent,
  CreateTriggerDialogInput
} from '../create-trigger-dialog/create-trigger-dialog.component';

@Component({
  selector: 'b3n-select-trigger',
  templateUrl: './select-trigger.component.html',
  styleUrls: ['./select-trigger.component.scss']
})
export class SelectTriggerComponent extends DestroySubscriberComponent implements OnInit {
  showForApp: string;
  AppName = AppName;

  flow: Flow;
  trigger: Trigger;
  creating: boolean;
  triggerDefs: TriggerDef[];
  filteredTriggerDefs: TriggerDef[];
  selectedTriggerDef: TriggerDef[] = [];
  searchTriggerCtrl = new UntypedFormControl('');

  constructor(
    private dialog: MatDialog,
    private appStateQuery: AppStateQuery,
    private simpleAppFlowService: SimpleAppFlowService,
    private flowService: FlowService,
    private flowQuery: FlowQuery,
    private triggerQuery: TriggerQuery,
    private triggerDefQuery: TriggerDefQuery,
    private connectorService: ConnectorService,
    private connectorQuery: ConnectorQuery,
    private triggerService: TriggerService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit() {
    this.showForApp = this.appStateQuery.getName();

    this.flowQuery
      .select()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(flow => {
        this.flow = flow;
      });

    this.triggerQuery
      .select()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(trigger => {
        this.trigger = trigger;
      });

    this.triggerDefQuery
      .selectAll({ sortBy: 'displayName' })
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(triggerDefs => {
        const triggerSubroutine = <TriggerDef>{
          uuid: 'SUBROUTINE',
          connector: { name: '', iconUrl: 'assets/flow-shared/icons/shortcut.svg' },
          name: 'Triggered by other flows',
          iconUrl: 'assets/flow-shared/icons/shortcut.svg',
          displayName: 'Triggered by other flows',
          description:
            'Turn your flow into a Subroutine that can be embedded into other flows and can only be triggered by them'
        };
        const triggerBaCreator = <TriggerDef>{
          uuid: 'BUSINESS_ACTION',
          connector: { name: '', iconUrl: 'assets/flow-shared/icons/electric_bolt.svg' },
          name: 'Business action',
          iconUrl: 'assets/flow-shared/icons/electric_bolt.svg',
          displayName: 'Business action',
          description: ''
        };

        switch (this.showForApp) {
          case AppName.FLOW:
          case AppName.PROGRAMMABLE_FLOW:
            this.triggerDefs = [...triggerDefs, triggerSubroutine];
            break;
          case AppName.BUSINESS_ACTION_CREATOR:
            this.triggerDefs = [triggerBaCreator, triggerSubroutine];
            break;
        }

        this.filteredTriggerDefs = this.triggerDefs;
      });

    this.searchTriggerCtrl.valueChanges.pipe(startWith('')).subscribe(val => {
      this.filteredTriggerDefs = this.triggerDefs.filter(
        t => t.displayName?.toLowerCase().indexOf(val.toLowerCase()) >= 0
      );
    });
  }

  private showCreateTriggerDialog() {
    let input: CreateTriggerDialogInput;

    switch (this.selectedTriggerDef[0].uuid) {
      case 'SUBROUTINE':
        input = { type: 'SUBROUTINE', triggerSelected: null };
        break;
      case 'BUSINESS_ACTION':
        input = { type: 'BUSINESS_ACTION', triggerSelected: null };
        break;
      default:
        input = { type: 'NORMAL', triggerSelected: this.selectedTriggerDef[0] };
        break;
    }

    this.dialog
      .open(CreateTriggerDialogComponent, {
        width: '700px',
        disableClose: true,
        autoFocus: false,
        panelClass: 'fif-dialog',
        data: input
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.doneCreate();
        }
      });
  }

  private createTrigger() {
    const request = <TriggerReq>{
      configs: <TriggerConfig>{
        urlMappings: [],
        headersMappings: [],
        bodyMappings: []
      },
      defUuid: this.selectedTriggerDef[0].uuid
    };
    this.creating = true;
    this.triggerService
      .createTrigger(this.flow.uuid, this.flow.version, request)
      .pipe(finalize(() => (this.creating = false)))
      .subscribe({
        next: () => {
          this.toastService.success('Event has been created');
          this.doneCreate();
        },
        error: err => this.toastService.error(err.message)
      });
  }

  private doneCreate() {
    this.selectedTriggerDef = [];
    this.connectorService
      .getConnectorsSuggestion(<ConnectorSuggestionReq>{
        flowUuid: this.flow.uuid,
        version: this.flow.version
      })
      .subscribe();
    this.flowService.getMenuTree(this.flow.uuid, this.flow.version).subscribe();

    if (this.showForApp === AppName.PROGRAMMABLE_FLOW) {
      this.simpleAppFlowService
        .getActions(<GetActionReq>{
          flowUuid: this.flow.uuid,
          version: this.flow.version
        })
        .subscribe();
    }
  }

  selectTrigger() {
    if (this.selectedTriggerDef.length > 0 && this.flow.editable) {
      const connector = this.connectorQuery.getAll()?.find(c => c.uuid === this.selectedTriggerDef[0].connector.uuid);
      if (
        connector?.needToSetAuthInfo ||
        connector?.needToSetParam ||
        this.selectedTriggerDef[0].uuid === 'SUBROUTINE' ||
        this.selectedTriggerDef[0].uuid === 'BUSINESS_ACTION' ||
        this.selectedTriggerDef[0].urlParameters?.length ||
        this.selectedTriggerDef[0].bodyParameters?.length ||
        this.selectedTriggerDef[0].headersParameters?.length ||
        this.selectedTriggerDef[0].extensionConfig.extendable
      ) {
        this.showCreateTriggerDialog();
      } else {
        this.createTrigger();
      }
    }
  }
}
