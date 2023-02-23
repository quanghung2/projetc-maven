import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { KeyValue } from '@angular/common';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  AgentConfig,
  AgentId,
  AgentService,
  AgentWorkflowConfig,
  AssignedAgent,
  CallflowConfig,
  OrgConfig,
  OrgConfigQuery,
  PopupNotificationMode,
  QueueConfig,
  QueueInfo,
  QueueService
} from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

interface AssigningAgent {
  id: AgentId;
  displayText: string;
  proficiency: number;
}

@Component({
  selector: 'b3n-agent-management-config',
  templateUrl: './agent-management-config.component.html',
  styleUrls: ['./agent-management-config.component.scss']
})
export class AgentManagementConfigComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild('codeOption') codeOption: ElementRef;

  count: number;
  loading: boolean;
  saving = false;
  allAgents: AgentConfig[];
  queue: QueueConfig;
  orgConfig: OrgConfig;
  assignedAgents: AssigningAgent[];

  readonly popupNotificationModes: KeyValue<PopupNotificationMode, string>[] = [
    { key: PopupNotificationMode.dialing, value: 'Dialing' },
    { key: PopupNotificationMode.afterPickup, value: 'After pickup' }
  ];

  readonly slaThresholds: KeyValue<number, string>[] = [
    { key: 5, value: '5' },
    { key: 10, value: '10' },
    { key: 15, value: '15' },
    { key: 20, value: '20' },
    { key: 30, value: '30' },
    { key: 45, value: '45' },
    { key: 60, value: '60' },
    { key: 90, value: '90' }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: QueueInfo,
    private queueService: QueueService,
    private agentService: AgentService,
    private spinnerService: LoadingSpinnerSerivce,
    public dialogRef: MatDialogRef<AgentManagementConfigComponent>,
    private toastService: ToastService,
    private orgConfigQuery: OrgConfigQuery
  ) {
    super();
  }

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading = true;
    this.spinnerService.showSpinner();

    this.orgConfigQuery.orgConfig$.pipe(takeUntil(this.destroySubscriber$)).subscribe(config => {
      this.orgConfig = config;
    });

    forkJoin([this.agentService.findAgentConfigs(), this.queueService.getQueueConfig(this.data.uuid)])
      .pipe(finalize(() => this.spinnerService.hideSpinner()))
      .subscribe(
        ([agents, queueConfig]) => {
          this.allAgents = agents;
          this.queue = queueConfig;
          this.assignedAgents = queueConfig.assignedAgents
            .map(assignedAgent => {
              let result = null;
              const mapped = this.allAgents.find(agent => agent.id.identityUuid === assignedAgent.agentId.identityUuid);
              if (mapped) {
                result = <AssigningAgent>{
                  id: mapped.id,
                  displayText: mapped.displayText,
                  proficiency: assignedAgent.proficiency
                };
                return result;
              }
            })
            .filter(a => a != null);
          this.count = this.assignedAgents.filter(x => x.proficiency === null || x.proficiency === 0)?.length;
          this.loading = false;
        },
        err => {
          this.loading = false;
          this.toastService.error(err.message);
        }
      );
  }

  changeProficiency() {
    this.count = this.assignedAgents.filter(x => x.proficiency === 0 || x.proficiency === null)?.length;
  }

  assignAgent(agent: AgentConfig) {
    if (this.assignedAgents.find(ag => ag.id.identityUuid === agent.id.identityUuid)) {
      return;
    }
    const a = <AssigningAgent>{
      id: agent.id,
      displayText: agent.displayText,
      proficiency: 1
    };
    this.assignedAgents.push(a);
  }

  save() {
    this.saving = true;
    const isProficiency = this.queue.callflowConfig.ringMode === 'proficiency';
    this.queue.assignedAgents = this.assignedAgents.map(a => {
      return <AssignedAgent>{
        agentId: a.id,
        proficiency: isProficiency ? a.proficiency : null
      };
    });
    const config = {
      slaThreshold: this.queue.slaThreshold,
      callflowConfig: {
        ringTime: this.queue.callflowConfig.ringTime,
        ringMode: this.queue.callflowConfig.ringMode
      } as CallflowConfig,
      agentWorkflowConfig: {
        disableNotes: this.queue.agentWorkflowConfig.disableNotes,
        popupNotificationMode: this.queue.agentWorkflowConfig.popupNotificationMode,
        script: this.queue.agentWorkflowConfig.script
      } as AgentWorkflowConfig,
      assignedAgents: this.queue.assignedAgents,
      thresholdConfigs: this.queue.thresholdConfigs
    } as QueueConfig;

    if (this.queue.callflowConfig.ringMode === 'stickyAgent') {
      config.callflowConfig.dialNumber = this.queue.callflowConfig.dialNumber;
    }

    this.queueService
      .updateQueueConfig(this.data.uuid, config)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        queue => {
          this.dialogRef.close(Object.assign(new QueueConfig(), queue));
          this.toastService.success('Agent management has been updated. This update will take effect after 5 minutes.');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  deleteAssignedAgent(index) {
    this.assignedAgents.splice(index, 1);
  }

  dropAgents(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.assignedAgents, event.previousIndex, event.currentIndex);
    this.updateProficiency();
  }

  private updateProficiency() {
    for (let i = 0; i < this.assignedAgents.length; i++) {
      if (this.assignedAgents[i].proficiency === this.assignedAgents.length - 1 - i) {
        continue;
      }
      this.assignedAgents[i].proficiency = this.assignedAgents.length - 1 - i;
    }
  }
}
