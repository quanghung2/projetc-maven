import { ComponentType } from '@angular/cdk/portal';
import { KeyValue } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CreateRequest, OrgConfigQuery, QueueInfo, QueueService } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { BaUserService, InputBaUserReq, SimpleAppFlowService, TriggerDef } from '@b3networks/api/flow';
import { QueueManagementDialogComponent } from '@b3networks/fi/flow/feature/business-action';
import { BaUserGroupID } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { ActionEventsConfigComponent } from './action-events-config/action-events-config.component';
import { AgentManagementConfigComponent } from './agent-management-config/agent-management-config.component';
import { CallSurveyComponent } from './call-survey-config/call-survey-config.component';
import { ConcurrentCallComponent } from './concurrent-call/concurrent-call.component';
import { CreateQueueComponent, DialogCreateQueue } from './create-queue/create-queue.component';
import { DeleteQueueComponent } from './delete-queue/delete-queue.component';
import { EditQueueComponent, EditQueueInput } from './edit-queue/edit-queue.component';
import { MessageConfigComponent } from './message-config/message-config.component';
import { MohConfigComponent } from './moh-config/moh-config.component';
import { NoteConfigComponent } from './note-config/note-config.component';
import { VoicemailCallbackComponent } from './voicemail-callback/voicemail-callback.component';

export class QueryFilter {
  queryString: string;

  constructor(queryString: string) {
    this.queryString = queryString;
  }
}

export const MAX_QUEUES = 100;

@Component({
  selector: 'b3n-queue-list',
  templateUrl: './queue-list.component.html',
  styleUrls: ['./queue-list.component.scss']
})
export class QueueListComponent extends DestroySubscriberComponent implements OnInit {
  readonly typeOptions: KeyValue<string, string>[] = [
    { key: 'manual', value: 'Manual' },
    { key: 'auto', value: 'Auto' }
  ];
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  loading: boolean;
  queues: QueueInfo[];
  // displayColumns = ['priority', 'label', 'queueconfig', 'queuetype', 'action'];
  displayColumns = ['priority', 'label', 'extension', 'numberofagent', 'action'];
  dataSource: MatTableDataSource<QueueInfo>;
  queryParams: QueryFilter = new QueryFilter('');
  hasOutbound = false;
  listFlow: { code: string; name: string }[] = [];
  filteredType = '';
  triggerDefs: TriggerDef[] = [];
  isMaxQueue: boolean;

  constructor(
    public dialog: MatDialog,
    private queueService: QueueService,
    private orgConfigQuery: OrgConfigQuery,
    private toastService: ToastService,
    private simpleAppFlowService: SimpleAppFlowService,
    private baUserService: BaUserService
  ) {
    super();
  }

  ngOnInit() {
    let releaseGroupId = <string>BaUserGroupID.QUEUE_MANAGEMENT;
    if (X.orgUuid === 'f17b4dd0-1d78-49c7-8e31-ca4b0ad1f9b9') {
      releaseGroupId = `${releaseGroupId}Test`;
    }

    combineLatest([
      this.orgConfigQuery.orgConfig$,
      this.simpleAppFlowService.getFlows('voice', new Pageable(0, 1000)),
      this.baUserService.getTriggerDefs(releaseGroupId, false)
    ])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([org, flow, triggerDefs]) => {
        this.initListFlowOfOrg(flow.content, org);
        this.reload();
        this.triggerDefs = triggerDefs.sort((a, b) => a.name.localeCompare(b.name));
      });
  }

  create() {
    this.showDialog(
      CreateQueueComponent,
      <DialogCreateQueue>{
        isDuplicate: false,
        data: new CreateRequest(new QueueInfo()),
        listFlow: this.listFlow,
        isCreate: this.queues.length < 100
      },
      true,
      {
        width: '450px'
      }
    );
  }

  duplicate(queue: QueueInfo) {
    this.showDialog(
      CreateQueueComponent,
      <DialogCreateQueue>{
        isDuplicate: true,
        data: new CreateRequest(queue),
        listFlow: this.listFlow,
        isCreate: this.queues.length < 100
      },
      true,
      {
        width: '450px'
      }
    );
  }

  delete(queue: QueueInfo) {
    this.showDialog(DeleteQueueComponent, queue);
  }

  edit(queue: QueueInfo) {
    this.showDialog(EditQueueComponent, <EditQueueInput>{
      queue: queue,
      listFlow: this.listFlow
    });
  }

  agentManagementConfig(queue: QueueInfo) {
    this.showDialog(AgentManagementConfigComponent, queue, false, { width: '600px' });
  }

  noteConfiguration(queue: QueueInfo) {
    this.showDialog(NoteConfigComponent, queue, false, { maxWidth: 700 });
  }

  showConcurrentCallConfig(queue: QueueInfo) {
    this.showDialog(ConcurrentCallComponent, queue);
  }

  mohConfig(queue: QueueInfo) {
    this.showDialog(MohConfigComponent, queue, false, { minWidth: 1000 });
  }

  messageConfig(queue: QueueInfo) {
    this.showDialog(MessageConfigComponent, queue);
  }

  actionEventsConfig(queue: QueueInfo) {
    const dialogCfg = {
      minWidth: '600px',
      maxHeight: '80vh',
      minHeight: '200px',
      disableClose: true
    };
    this.showDialog(ActionEventsConfigComponent, queue, false, dialogCfg);
  }

  voicemailCallbackConfig(queue: QueueInfo) {
    this.showDialog(VoicemailCallbackComponent, queue, false, { width: '500px' });
  }

  openPostCallSurvey(queue: QueueInfo) {
    this.dialog.open(CallSurveyComponent, {
      width: '500px',
      data: queue
    });
  }

  getDataByFilter(queue: QueueInfo[], filter: QueryFilter) {
    return queue.filter(item => {
      const checkName = item.label.toLowerCase().trim().includes(filter.queryString.toLowerCase().trim());
      return checkName;
    });
  }

  addGenieName(queue: QueueInfo[]) {
    queue.forEach(q => {
      q.callflowConfig['genieName'] = this.findGenieInFlows(q.callflowConfig.genieCode);
    });

    return queue;
  }

  findGenieInFlows(genieCame) {
    const foundFlow = this.listFlow.find(l => l.code === genieCame);
    return foundFlow?.name || '';
  }

  reload() {
    this.loading = true;
    this.filteredType = '';
    this.queueService
      .loadQueueList()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        res => {
          this.queues = this.getDataByFilter(res, this.queryParams);
          this.queues = this.addGenieName(this.queues);
          this.isMaxQueue = this.queues.length >= MAX_QUEUES;
          this.sortByPriorityAndLabel();
          this.dataSource = new MatTableDataSource(this.queues);
          setTimeout(() => {
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
          });
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  showDialog<T, D = any, R = any>(
    componentOrTemplateRef: ComponentType<T>,
    data: any,
    refreshAfter = true,
    dialogCfg: MatDialogConfig = {}
  ): MatDialogRef<T, R> {
    dialogCfg.data = data;
    dialogCfg.autoFocus = false;
    dialogCfg.disableClose = true;
    if (!dialogCfg.minWidth) {
      dialogCfg.minWidth = '450px';
    }
    const dialogRef = this.dialog.open(componentOrTemplateRef, dialogCfg);

    if (refreshAfter) {
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.reload();
        }
      });
    }

    return dialogRef;
  }

  initListFlowOfOrg(flow, org) {
    this.listFlow = [];
    const genieConfig = org.transfer2GenieConfig;
    for (const genie in genieConfig) {
      if (genieConfig[genie]) {
        const foundUuid = genieConfig[genie].fields?.find(g => g.fieldValue);
        const foundUuidInFlow = flow.find(f => f.uuid === foundUuid.fieldValue);
        if (foundUuidInFlow) {
          this.listFlow.push({ code: genie.split(':')[1], name: foundUuidInFlow.name });
        }
      }
    }
  }

  onChangeType(type: 'manual' | 'auto' | '') {
    const queues = this.queues.filter(q =>
      type === 'auto' ? q.callflowConfig.genieCode : type === 'manual' ? !q.callflowConfig.genieCode : q
    );
    this.dataSource = new MatTableDataSource(queues);
    setTimeout(() => {
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    });
  }

  baUserConfig(queue: QueueInfo, triggerDef: TriggerDef) {
    this.dialog.open(QueueManagementDialogComponent, {
      width: '700px',
      disableClose: true,
      autoFocus: false,
      data: new InputBaUserReq({
        triggerDef,
        defaultParam: { queueUuid: queue.uuid },
        hideDefaultParam: true,
        queueName: queue.label
      })
    });
  }

  private sortByPriorityAndLabel() {
    this.queues = this.queues.sort(function (a, b) {
      if (a.priority === b.priority) {
        return a.label.localeCompare(b.label);
      }
      return b.priority > a.priority ? 1 : -1;
    });
  }
}
