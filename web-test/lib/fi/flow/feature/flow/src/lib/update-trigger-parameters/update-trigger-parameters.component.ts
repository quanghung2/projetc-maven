import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import {
  DataSourceService,
  Flow,
  FlowQuery,
  ResolveDependencyInput,
  Trigger,
  TriggerDef,
  TriggerDefQuery,
  TriggerDefService,
  TriggerQuery,
  TriggerReq,
  TriggerService
} from '@b3networks/api/flow';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, takeUntil } from 'rxjs/operators';
import { BaseActionFlowComponent } from '../base-action-flow/base-action-flow.component';
import { ExtendTriggerComponent } from '../flow-detail/extend-trigger/extend-trigger.component';

@Component({
  selector: 'b3n-update-trigger-parameters',
  templateUrl: './update-trigger-parameters.component.html',
  styleUrls: ['./update-trigger-parameters.component.scss']
})
export class UpdateTriggerParametersComponent extends BaseActionFlowComponent implements OnInit {
  @Input() disabledEdit: boolean;
  @Output() closeDialog = new EventEmitter<void>();
  @ViewChild('extendTrigger') extendTrigger: ExtendTriggerComponent;

  flow: Flow;
  trigger: Trigger;
  editable: boolean;
  updating: boolean;
  triggerConfigs: UntypedFormGroup;

  showResolveDependency: boolean;
  dataOfResolve: ResolveDependencyInput;

  constructor(
    fb: UntypedFormBuilder,
    cdr: ChangeDetectorRef,
    dataSourceService: DataSourceService,
    private triggerDefService: TriggerDefService,
    private triggerDefQuery: TriggerDefQuery,
    private flowQuery: FlowQuery,
    private triggerService: TriggerService,
    private triggerQuery: TriggerQuery,
    private toastService: ToastService
  ) {
    super(fb, cdr, dataSourceService);
  }

  ngOnInit(): void {
    this.flow = this.flowQuery.getValue();
    this.trigger = this.triggerQuery.getValue();
    this.editable = this.flow.editable && !this.disabledEdit;

    this.triggerConfigs = this.fb.group({
      urlMappings: this.fb.array([]),
      headersMappings: this.fb.array([]),
      bodyMappings: this.fb.array([])
    });

    this.triggerDefQuery
      .selectAll()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(triggerDefs => {
        const selectedTriggerDef = triggerDefs.find(trgd => trgd.uuid === this.trigger.def?.triggerDefUuid);
        if (selectedTriggerDef) {
          this.setParameter(selectedTriggerDef);
          this.fetchSelections(this.flow);
        } else {
          this.triggerDefService.getTriggerDef(this.trigger.def?.triggerDefUuid).subscribe(triggerDef => {
            this.setParameter(triggerDef);
            this.fetchSelections(this.flow);
          });
        }

        if (!this.editable) {
          this.triggerConfigs.disable();
        }
      });

    this.triggerConfigs.valueChanges.subscribe(() => {
      this.showOptionalParam = this.isShowOptionalParam(this.triggerConfigs);
      this.cdr.detectChanges();
    });
  }

  private setParameter(selectedTriggerDef: TriggerDef) {
    const formUrl = this.fb.array([]);
    const formHeader = this.fb.array([]);
    const formBody = this.fb.array([]);

    selectedTriggerDef.urlParameters?.forEach(p => {
      if (!p.hidden) {
        const mapping = this.trigger?.configs?.urlMappings.find(m => m.key === p.key);
        formUrl.push(this.createFormGroup(p, this.editable, mapping));
      }
    });

    selectedTriggerDef.headersParameters?.forEach(p => {
      if (!p.hidden) {
        const mapping = this.trigger?.configs?.headersMappings.find(m => m.key === p.key);
        formHeader.push(this.createFormGroup(p, this.editable, mapping));
      }
    });

    selectedTriggerDef.bodyParameters?.forEach(p => {
      if (!p.hidden) {
        const mapping = this.trigger?.configs?.bodyMappings.find(m => m.key === p.key);
        formBody.push(this.createFormGroup(p, this.editable, mapping));
      }
    });

    this.updateVisibleParams(formUrl);
    this.updateVisibleParams(formHeader);
    this.updateVisibleParams(formBody);

    this.triggerConfigs.setControl('urlMappings', formUrl);
    this.triggerConfigs.setControl('headersMappings', formHeader);
    this.triggerConfigs.setControl('bodyMappings', formBody);
  }

  private extend() {
    const body = <TriggerReq>{
      extensionConfig: {
        mode: this.extendTrigger.modeExtendCtrl.value,
        extendedOutputs:
          this.extendTrigger.modeExtendCtrl.value === 'BASIC'
            ? this.extendTrigger.formOutputBasic.getRawValue()
            : this.extendTrigger.formOutputAdvanced.getRawValue()
      },
      dependantsUpdateRequest: {}
    };

    this.triggerService
      .extendTrigger(this.flow.uuid, this.flow.version, body)
      .pipe(finalize(() => (this.updating = false)))
      .subscribe({
        next: res => {
          if (res.status === 'ok') {
            this.toastService.success('Event has been updated');
            this.closeDialog.emit();
          } else if (res?.dependencies?.length) {
            this.showResolveDependency = true;
            this.dataOfResolve = <ResolveDependencyInput>{
              dependencys: res.dependencies,
              replace: true,
              extendTriggerData: body,
              isTrigger: true,
              isExtendTrigger: true,
              newTriggerOutputProperties: res.newTriggerOutputProperties
            };
          }
        },
        error: err => this.toastService.error(err.message)
      });
  }

  disableSubmit() {
    if (this.triggerConfigs.invalid || !this.editable) {
      return true;
    } else {
      if (this.trigger.extensionConfig.extendable && this.extendTrigger) {
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

  update() {
    if (!this.disableSubmit()) {
      this.updating = true;
      this.triggerService
        .updateTrigger(this.flow.uuid, this.flow.version, <TriggerReq>{
          configs: this.getConfigs(this.triggerConfigs)
        })
        .subscribe({
          next: () => {
            if (this.trigger.extensionConfig.extendable) {
              this.extend();
            } else {
              this.toastService.success('Event has been updated');
              this.closeDialog.emit();
            }
          },
          error: err => {
            this.updating = false;
            this.toastService.error(err.message);
          }
        });
    }
  }

  resultResolve(e) {
    if (e?.isDependency) {
      this.showResolveDependency = false;
      this.cdr.detectChanges();
      this.dataOfResolve.dependencys = e.dependencies;
      this.dataOfResolve.newTriggerOutputProperties = e.newTriggerOutputProperties;
      this.showResolveDependency = true;
    } else {
      this.toastService.success('Event has been updated');
      this.closeDialog.emit();
    }
  }
}
