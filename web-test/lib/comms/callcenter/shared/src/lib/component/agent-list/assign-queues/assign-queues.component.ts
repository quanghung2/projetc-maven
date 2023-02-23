import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Agent, AgentService, AssignedQueue, QueueInfo, QueueService } from '@b3networks/api/callcenter';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

export interface AssignQueuesInput {
  agent: Agent;
  queues: QueueInfo[];
}

@Component({
  selector: 'b3n-assign-queues',
  templateUrl: './assign-queues.component.html',
  styleUrls: ['./assign-queues.component.scss']
})
export class AssignQueuesComponent implements OnInit {
  agent: Agent;
  assignedQueues: AssignedQueue[] = [];
  queues: QueueInfo[] = [];
  selectedQueues: string[] = [];
  checkProficiency: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: AssignQueuesInput,
    private dialogRef: MatDialogRef<AssignQueuesComponent>,
    private queueService: QueueService,
    private agentService: AgentService,
    private toastService: ToastService,
    private spinnerService: LoadingSpinnerSerivce
  ) {
    this.agent = data.agent;
    if (this.agent) {
      this.selectedQueues = []; //  this.agent.assignedQueues;
    }
  }

  ngOnInit() {
    this.spinnerService.showSpinner();
    forkJoin([
      this.agentService.getAssignedQueues(this.agent.identityUuid), //.pipe(catchError(_ => of([]))),
      this.queueService.loadQueueList()
    ])
      .pipe(finalize(() => this.spinnerService.hideSpinner()))
      .subscribe(
        ([assignedQueues, queues]) => {
          this.assignedQueues = assignedQueues;
          this.selectedQueues = assignedQueues.map(q => q.uuid); //  this.agent.assignedQueues;
          this.queues = queues;
          this.selectedQueues.forEach(queue => {
            if (queues.filter(x => x.uuid.includes(queue))[0].callflowConfig.ringMode == 'proficiency') {
              this.checkProficiency = true;
            }
          });
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  onChange($event) {
    let count = 0;
    $event.forEach(queue => {
      if (this.queues.filter(x => x.uuid.includes(queue))[0].callflowConfig.ringMode == 'proficiency') {
        count++;
      }
    });
    if (count == 0) {
      this.checkProficiency = false;
    } else {
      this.checkProficiency = true;
    }
  }

  assign() {
    const assignedQueueUuids = this.assignedQueues.map(q => q.uuid);
    const newQueueUuids = this.selectedQueues.filter(uuid => !assignedQueueUuids.includes(uuid));

    const deletedQueueUuids = assignedQueueUuids.filter(
      uuid => this.selectedQueues.findIndex(newQueue => newQueue === uuid) === -1
    );

    const subscriptions = [];
    newQueueUuids.map(queueUuid => {
      subscriptions.push(this.queueService.assignAgent(queueUuid, this.agent.identityUuid));
    });

    deletedQueueUuids.forEach(queueUuid => {
      subscriptions.push(this.queueService.unassignAgent(queueUuid, this.agent.identityUuid));
    });

    this.spinnerService.showSpinner();
    forkJoin(subscriptions)
      .pipe(finalize(() => this.spinnerService.hideSpinner()))
      .subscribe(
        data => {
          this.dialogRef.close(data);
          this.toastService.success('Agents have been assigned');
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }
}
