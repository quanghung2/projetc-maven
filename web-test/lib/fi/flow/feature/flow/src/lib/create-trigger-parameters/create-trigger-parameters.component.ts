import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import {
  Connector,
  ConnectorQuery,
  DataSourceService,
  ExtensionConfig,
  Flow,
  FlowQuery,
  Trigger,
  TriggerDef,
  TriggerDefQuery,
  TriggerQuery,
  TriggerReq,
  TriggerService
} from '@b3networks/api/flow';
import { AppName, AppStateQuery } from '@b3networks/fi/flow/shared';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { finalize, startWith, takeUntil } from 'rxjs/operators';
import { BaseActionFlowComponent } from '../base-action-flow/base-action-flow.component';
import { ConnectorConfigComponent } from '../connector-config/connector-config.component';
import { ExtendTriggerComponent } from '../flow-detail/extend-trigger/extend-trigger.component';
import { ReplaceTriggerDialogReq } from '../replace-trigger-dialog/replace-trigger-dialog.component';

@Component({
  selector: 'b3n-create-trigger-parameters',
  templateUrl: './create-trigger-parameters.component.html',
  styleUrls: ['./create-trigger-parameters.component.scss']
})
export class CreateTriggerParametersComponent extends BaseActionFlowComponent implements OnInit, OnDestroy {
  @Input() replaceTriggerInput: ReplaceTriggerDialogReq;
  @Input() isShowDropdow = true;
  @Input() triggerSelected: TriggerDef;
  @ViewChild('config') config: ConnectorConfigComponent;
  @ViewChild('extendTrigger') extendTrigger: ExtendTriggerComponent;
  @Output() onTriggerData = new EventEmitter<TriggerReq>();
  @Output() onClose = new EventEmitter<boolean>();

  showForApp: string;
  AppName = AppName;

  flow: Flow;
  trigger: Trigger;
  formCreateFlow: UntypedFormGroup;
  creating: boolean;
  showParameters: boolean;
  configInvalid: boolean;
  triggerDefs: TriggerDef[];
  filteredTriggerDefs: TriggerDef[];
  searchTriggerCtrl = new UntypedFormControl();
  selectedTriggerDef: TriggerDef;
  selectedConnector: Connector;
  connectorToSetConfig: Connector;

  triggerCtrl = new UntypedFormControl('', Validators.required);
  getErrorTrigger = () => (this.triggerCtrl.hasError('required') ? 'This field is required' : '');

  compareTriggerDef(p1: TriggerDef, p2: TriggerDef): boolean {
    return !p1 || !p2 ? false : p1.uuid === p2.uuid;
  }

  get formTriggerConfigs(): UntypedFormGroup {
    return this.formCreateFlow.get('triggerConfigs') as UntypedFormGroup;
  }

  constructor(
    fb: UntypedFormBuilder,
    cdr: ChangeDetectorRef,
    dataSourceService: DataSourceService,
    private appStateQuery: AppStateQuery,
    private flowQuery: FlowQuery,
    private triggerService: TriggerService,
    private triggerQuery: TriggerQuery,
    private triggerDefQuery: TriggerDefQuery,
    private connectorQuery: ConnectorQuery,
    private toastService: ToastService
  ) {
    super(fb, cdr, dataSourceService);
  }

  ngOnInit() {
    this.showForApp = this.appStateQuery.getName();
    this.flow = this.flowQuery.getValue();
    this.trigger = this.triggerQuery.getValue();
    this.triggerDefs = this.triggerDefQuery.getAll({
      filterBy: item =>
        this.replaceTriggerInput?.replace &&
        this.replaceTriggerInput?.isTrigger &&
        item.uuid !== this.trigger.def?.triggerDefUuid,
      sortBy: 'displayName'
    });

    this.formCreateFlow = this.fb.group({
      description: [''],
      type: ['NORMAL'],
      triggerDefUuid: ['', Validators.required],
      triggerConfigs: this.fb.group({
        urlMappings: this.fb.array([]),
        headersMappings: this.fb.array([]),
        bodyMappings: this.fb.array([])
      })
    });

    this.searchTriggerCtrl.valueChanges.pipe(startWith('')).subscribe(val => {
      this.filteredTriggerDefs = this.triggerDefs.filter(
        t => t.displayName?.toLowerCase().indexOf(val.toLowerCase()) >= 0
      );
    });

    this.triggerCtrl.valueChanges.subscribe((val: TriggerDef) => {
      this.selectedConnector = null;
      this.selectedTriggerDef = val;
      this.setParameter();
      this.connectorQuery
        .selectEntity(c => c.uuid === this.selectedTriggerDef.connector.uuid)
        .pipe(takeUntil(this.destroySubscriber$))
        .subscribe(connector => {
          this.selectedConnector = connector;
          this.connectorToSetConfig = cloneDeep(connector);
          if (!this.selectedConnector.needToSetAuthInfo && !this.selectedConnector.needToSetParam) {
            this.configInvalid = false;
          } else {
            this.configInvalid = true;
          }
        });
    });

    // Set init event for case upgrade event
    if (this.replaceTriggerInput?.isDeprecated && this.replaceTriggerInput?.isShowOnlyParameter) {
      this.triggerCtrl.setValue(this.replaceTriggerInput?.triggerDef);
    }

    // Set init event for case create new event not author and parameters
    if (this.triggerSelected) {
      this.triggerCtrl.setValue(this.triggerSelected);
    }

    this.formTriggerConfigs.valueChanges.subscribe(() => {
      setTimeout(() => {
        this.showOptionalParam = this.isShowOptionalParam(this.formTriggerConfigs);
      });
    });
  }

  override ngOnDestroy() {
    this.dataSourceService.reset();
  }

  private setParameter() {
    this.dataSourceUuids.length = 0;

    const formUrl = this.fb.array([]);
    const formHeader = this.fb.array([]);
    const formBody = this.fb.array([]);

    this.selectedTriggerDef.urlParameters?.forEach(p => {
      if (!p.hidden) {
        formUrl.push(this.createFormGroup(p, this.flow.editable));
      }
    });
    this.selectedTriggerDef.headersParameters?.forEach(p => {
      if (!p.hidden) {
        formHeader.push(this.createFormGroup(p, this.flow.editable));
      }
    });
    this.selectedTriggerDef.bodyParameters?.forEach(p => {
      if (!p.hidden) {
        formBody.push(this.createFormGroup(p, this.flow.editable));
      }
    });

    if (this.dataSourceUuids.length > 0) {
      this.fetchSelections(this.flow);
    }

    this.updateVisibleParams(formUrl);
    this.updateVisibleParams(formHeader);
    this.updateVisibleParams(formBody);

    this.showParameters = formUrl.length > 0 || formHeader.length > 0 || formBody.length > 0;

    this.formCreateFlow = this.fb.group({
      description: [''],
      type: ['NORMAL'],
      triggerDefUuid: [this.selectedTriggerDef.uuid, Validators.required],
      triggerConfigs: this.fb.group({
        urlMappings: formUrl,
        headersMappings: formHeader,
        bodyMappings: formBody
      })
    });
  }

  disableSubmit() {
    if (this.formCreateFlow.invalid || this.configInvalid) {
      return true;
    } else {
      if (this.selectedTriggerDef?.extensionConfig.extendable && this.extendTrigger) {
        if (
          (this.extendTrigger.modeExtendCtrl.value === 'BASIC' && this.extendTrigger.formOutputBasic.invalid) ||
          (this.extendTrigger.modeExtendCtrl.value === 'ADVANCED' && this.extendTrigger.formOutputAdvanced.invalid)
        ) {
          return true;
        }
      }
    }
    return false;
  }

  create() {
    if (!this.disableSubmit()) {
      const data = cloneDeep(this.formCreateFlow.value);
      if (this.selectedConnector.needToSetAuthInfo || this.selectedConnector.needToSetParam) {
        this.config.setConfig(value => {
          if (value) {
            this.createFlow(data);
          }
        });
      } else {
        this.createFlow(data);
      }
    }
  }

  private createFlow(data) {
    const req = <TriggerReq>{
      configs: this.getConfigs(this.formTriggerConfigs),
      defUuid: data.triggerDefUuid
    };

    if (this.selectedTriggerDef.extensionConfig.extendable) {
      req.extensionConfig = <ExtensionConfig>{
        mode: this.extendTrigger.modeExtendCtrl.value,
        extendedOutputs:
          this.extendTrigger.modeExtendCtrl.value === 'BASIC'
            ? this.extendTrigger.formOutputBasic.getRawValue()
            : this.extendTrigger.formOutputAdvanced.getRawValue()
      };
    }

    if (this.replaceTriggerInput?.replace) {
      this.replaceTriggerInput.triggerDef = this.selectedTriggerDef;
      this.onTriggerData.emit(req);
      return;
    }

    this.creating = true;
    this.triggerService
      .createTrigger(this.flow.uuid, this.flow.version, req)
      .pipe(finalize(() => (this.creating = false)))
      .subscribe({
        next: () => {
          this.toastService.success('Event has been created');
          this.onClose.emit(true);
        },
        error: err => this.toastService.error(err.message)
      });
  }
}
