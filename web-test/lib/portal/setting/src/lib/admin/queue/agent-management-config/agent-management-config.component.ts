import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { KeyValue } from '@angular/common';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RingMode, ValueRingMode } from '@b3networks/api/bizphone';
import {
  AgentConfig,
  AgentId,
  AgentService,
  AssignedAgent,
  CallflowConfig,
  OrgConfig,
  OrgConfigQuery,
  PopupNotificationMode,
  QueueConfig,
  QueueInfo,
  QueueService
} from '@b3networks/api/callcenter';
import { DestroySubscriberComponent, MyErrorStateMatcher } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { delay, finalize, takeUntil } from 'rxjs/operators';

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
  readonly popupNotificationModes: KeyValue<PopupNotificationMode, string>[] = [
    { key: PopupNotificationMode.dialing, value: 'Dialing' },
    { key: PopupNotificationMode.afterPickup, value: 'After pickup' }
  ];

  @ViewChild('codeOption') codeOption: ElementRef;

  loading: boolean;
  saving = false;
  allAgents: AgentConfig[];
  queue: QueueConfig;
  orgConfig: OrgConfig;
  assignedAgents: AssigningAgent[];
  count: number;
  matcher = new MyErrorStateMatcher();
  queueForm: UntypedFormGroup;

  readonly RingMode = RingMode;
  readonly selectRingMode: KeyValue<string, string>[] = [
    {
      key: RingMode.roundRobin,
      value: ValueRingMode.roundRobin
    },
    {
      key: RingMode.ringAll,
      value: ValueRingMode.ringAll
    },
    {
      key: RingMode.proficiency,
      value: ValueRingMode.proficiency
    },
    {
      key: RingMode.stickyAgent,
      value: ValueRingMode.stickyAgent
    }
  ];

  get agentOptions() {
    const assignedAgentIds = this.assignedAgents.map(a => a.id);
    return this.allAgents?.filter(a => !assignedAgentIds.includes(a.id)) || [];
  }

  get ringMode() {
    return this.queueForm?.get('ringMode');
  }

  get ringTime() {
    return this.queueForm?.get('ringTime');
  }

  get dialNumber() {
    return this.queueForm?.get('dialNumber');
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: QueueInfo,
    private queueService: QueueService,
    private agentService: AgentService,
    private spinnerService: LoadingSpinnerSerivce,
    public dialogRef: MatDialogRef<AgentManagementConfigComponent>,
    private toastService: ToastService,
    private orgConfigQuery: OrgConfigQuery,
    private fb: UntypedFormBuilder
  ) {
    super();
  }

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading = true;

    this.orgConfigQuery
      .select()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(config => {
        this.orgConfig = config;
      });

    forkJoin([this.agentService.findAgentConfigs(), this.queueService.getQueueConfig(this.data.uuid)])
      .pipe(
        delay(400),
        finalize(() => (this.loading = false))
      )
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

          this.count = this.assignedAgents.filter(x => x.proficiency === 0)?.length;
          this.initForm();
        },
        err => {
          this.toastService.error(err.message);
          this.dialogRef.close();
        }
      );
  }

  changeProficiency() {
    this.count = this.assignedAgents.filter(x => x.proficiency === 0)?.length;
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
    if (this.queueForm.invalid || (this.count > 0 && this.ringMode.value === RingMode.proficiency)) return;
    this.saving = true;
    const isProficiency = this.ringMode.value === RingMode.proficiency;
    this.queue.assignedAgents = this.assignedAgents.map(a => {
      return <AssignedAgent>{
        agentId: a.id,
        proficiency: isProficiency ? a.proficiency : null
      };
    });
    const config = this.getConfigReq();
    this.queueService
      .updateQueueConfig(this.data.uuid, config)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        queue => {
          this.dialogRef.close(Object.assign(new QueueConfig(), queue));
          this.toastService.success('Agent management has been updated.');
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

  private getConfigReq(): Partial<QueueConfig> {
    const config = {
      callflowConfig: {
        ...this.queue.callflowConfig,
        ringTime: this.ringTime.value,
        ringMode: this.ringMode.value
      } as CallflowConfig,
      assignedAgents: this.queue.assignedAgents
    } as QueueConfig;
    if (this.ringMode.value === RingMode.stickyAgent) {
      config.callflowConfig.dialNumber = this.dialNumber.value;
    }
    return config;
  }

  private initForm() {
    this.queueForm = this.fb.group({
      ringTime: [this.queue.callflowConfig.ringTime, [Validators.min(1), Validators.max(900), Validators.required]],
      ringMode: this.queue.callflowConfig.ringMode
    });
    this.ringMode.valueChanges.subscribe(key => {
      if (key === RingMode.stickyAgent) {
        this.queueForm.addControl(
          'dialNumber',
          this.fb.control(this.queue.callflowConfig.dialNumber, [Validators.min(1), Validators.max(100)])
        );
        return;
      }
      this.queueForm.removeControl('dialNumber');
    });
  }
}
