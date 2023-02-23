import { Component, Inject, OnInit } from '@angular/core';
import { NgForm, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Extension } from '@b3networks/api/bizphone';
import {
  CallflowConfig,
  FieldsConfig,
  LicenceService,
  QueueConfig,
  QueueInfo,
  QueueService,
  ThresholdAction,
  ThresholdConfig,
  TtsConfig
} from '@b3networks/api/callcenter';
import {
  FillterSkillCatalog,
  SkillCatalog,
  SkillCatalogQuery,
  SkillCatalogService
} from '@b3networks/api/intelligence';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-action-events-config',
  templateUrl: './action-events-config.component.html',
  styleUrls: ['./action-events-config.component.scss']
})
export class ActionEventsConfigComponent extends DestroySubscriberComponent implements OnInit {
  queue: QueueConfig;
  queues: QueueInfo[];
  extensions: Extension[];
  skills: SkillCatalog[];
  formGroup: UntypedFormGroup = this.fb.group({
    maxQueueSizeThreshold: this.fb.group({}),
    maxWaitingTimeThreshold: this.fb.group({}),
    dialingThreshold: this.fb.group({})
  });
  isSaving: boolean;
  isInvalid = false;
  listAction = [
    {
      key: EnumTypeActionEvent.maxQueueSizeThreshold,
      label: 'Queue Size',
      placeholderInput: 'Maximum queue size',
      hangupMessage: <TtsConfig>null,
      announcementMessage: <TtsConfig>null
    },
    {
      key: EnumTypeActionEvent.maxWaitingTimeThreshold,
      label: 'Waiting Time',
      placeholderInput: 'Maximum wait time (in seconds)',
      hangupMessage: <TtsConfig>null,
      announcementMessage: <TtsConfig>null
    }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: QueueInfo,
    private queueService: QueueService,
    private licenseService: LicenceService,
    private spinnerService: LoadingSpinnerSerivce,
    private toastService: ToastService,
    private skillCatalogService: SkillCatalogService,
    private skillCatalogQuery: SkillCatalogQuery,
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<ActionEventsConfigComponent>
  ) {
    super();
    this.reload();

    this.formGroup.statusChanges.pipe(takeUntil(this.destroySubscriber$)).subscribe(status => {
      setTimeout(() => {
        this.isInvalid = status === 'INVALID';
      }, 0);
    });
  }

  ngOnInit() {}

  reload() {
    const filter: FillterSkillCatalog = this.skillCatalogQuery.getValue().ui;
    this.spinnerService.showSpinner();
    forkJoin([
      this.queueService.getQueueConfig(this.data.uuid),
      this.licenseService.findExtensions(),
      this.queueService.getQueuesFromCache(),
      this.skillCatalogService.getSkills(filter)
    ])
      .pipe(finalize(() => this.spinnerService.hideSpinner()))
      .subscribe(
        ([queue, extensions, cache, skills]: [QueueConfig, Extension[], QueueInfo[], SkillCatalog[]]) => {
          this.queue = queue;
          this.setEnableButton(this.queue.callflowConfig.maxQueueSizeThreshold);
          this.setEnableButton(this.queue.callflowConfig.maxWaitingTimeThreshold);
          this.setEnableButton(this.queue.callflowConfig.dialingThreshold);

          this.setMessageConfig(
            this.queue.callflowConfig.maxQueueSizeThreshold,
            EnumTypeActionEvent.maxQueueSizeThreshold
          );
          this.setMessageConfig(
            this.queue.callflowConfig.maxWaitingTimeThreshold,
            EnumTypeActionEvent.maxWaitingTimeThreshold
          );

          this.setMessageConfig(this.queue.callflowConfig.dialingThreshold, EnumTypeActionEvent.dialingThreshold);

          this.extensions = extensions;
          this.queues = cache.filter(queue => queue.uuid !== this.data.uuid);
          this.skills = skills;
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  setMessageConfig(threshold: ThresholdConfig, key: EnumTypeActionEvent) {
    const item = this.listAction.find(x => x.key === key);
    if (item) {
      item.hangupMessage = threshold.hangupMessageConfig;
      item.announcementMessage = threshold.callbackMessageConfig;
    }
  }

  updateXmlMessageConfig(threshold: ThresholdConfig, key: EnumTypeActionEvent) {
    const item = this.listAction.find(x => x.key === key);
    if (item) {
      threshold.hangupMessage = item.hangupMessage.xml();
      threshold.announcementMessage = item.announcementMessage.xml();
    }
  }

  setEnableButton(threshold: ThresholdConfig) {
    threshold.enabled = threshold.threshold > 0;
    if (threshold.action === ThresholdAction.genie) {
      threshold.threshold = -1;
      threshold.enabled = false;
      threshold.action = ThresholdAction.hangup;
    }
  }

  getValueEnableButton(threshold: ThresholdConfig) {
    return threshold.enabled ? (threshold.threshold > 0 ? threshold.threshold : 1) : -1;
  }

  enabledButton(key: EnumTypeActionEvent) {
    this.queue.callflowConfig[key].enabled = !this.queue.callflowConfig[key].enabled;
  }

  save() {
    this.isSaving = true;

    // threshold
    this.queue.callflowConfig.maxQueueSizeThreshold.threshold = this.getValueEnableButton(
      this.queue.callflowConfig.maxQueueSizeThreshold
    );
    this.queue.callflowConfig.maxWaitingTimeThreshold.threshold = this.getValueEnableButton(
      this.queue.callflowConfig.maxWaitingTimeThreshold
    );
    this.queue.callflowConfig.dialingThreshold.threshold = this.getValueEnableButton(
      this.queue.callflowConfig.dialingThreshold
    );

    // xml
    this.updateXmlMessageConfig(
      this.queue.callflowConfig.maxQueueSizeThreshold,
      EnumTypeActionEvent.maxQueueSizeThreshold
    );
    this.updateXmlMessageConfig(
      this.queue.callflowConfig.maxWaitingTimeThreshold,
      EnumTypeActionEvent.maxWaitingTimeThreshold
    );
    this.updateXmlMessageConfig(this.queue.callflowConfig.dialingThreshold, EnumTypeActionEvent.dialingThreshold);

    // update data genie
    this.getValueGenie();
    const config = {
      callflowConfig: {
        maxQueueSizeThreshold: this.queue.callflowConfig.maxQueueSizeThreshold,
        maxWaitingTimeThreshold: this.queue.callflowConfig.maxWaitingTimeThreshold,
        dialingThreshold: this.queue.callflowConfig.dialingThreshold
      } as CallflowConfig
    } as QueueConfig;

    this.queueService
      .updateQueueConfig(this.data.uuid, config)
      .pipe(
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe(
        queue => {
          this.dialogRef.close(true);
          this.toastService.success('Action events has been updated. This update will take effect after 5 minutes.');
        },
        err => {
          this.toastService.error(err.message || 'Update action events failed');
        }
      );
  }

  getValueGenie() {
    const value = Object.assign({}, this.formGroup.value);
    this.listAction.forEach(action => {
      const option = this.queue.callflowConfig[action.key].action;
      const enable = this.queue.callflowConfig[action.key].enabled;
      if (option === ThresholdAction.genie && enable) {
        this.queue.callflowConfig[action.key].genieConfig.skillId = value[action.key]?.data.skillId;
        this.queue.callflowConfig[action.key].genieConfig.fields = [];
        value[action.key]?.data?.params.forEach(param => {
          this.queue.callflowConfig[action.key].genieConfig.fields.push(
            new FieldsConfig({
              fieldValue: param.value,
              fieldName: param.key
            })
          );
        });
      }
    });
  }

  invalidForm(form: NgForm) {
    const maxQueueSizeThreshold = this.queue.callflowConfig.maxQueueSizeThreshold;
    const maxWaitingTimeThreshold = this.queue.callflowConfig.maxWaitingTimeThreshold;
    const dialingThreshold = this.queue.callflowConfig.dialingThreshold;
    if (
      (maxWaitingTimeThreshold.enabled && maxWaitingTimeThreshold.threshold <= 0) ||
      (maxQueueSizeThreshold.enabled && maxQueueSizeThreshold.threshold <= 0) ||
      (dialingThreshold.enabled && dialingThreshold.threshold <= 0) ||
      form.invalid
    ) {
      return true;
    }
    return false;
  }
}

export enum EnumTypeActionEvent {
  maxQueueSizeThreshold = 'maxQueueSizeThreshold',
  maxWaitingTimeThreshold = 'maxWaitingTimeThreshold',
  dialingThreshold = 'dialingThreshold'
}
