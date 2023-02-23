import { ComponentType } from '@angular/cdk/portal';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CreateRequest, OrgConfigQuery, QueueInfo, QueueService } from '@b3networks/api/callcenter';
import { FlowService } from '@b3networks/api/flow';
import { FindSubscriptionReq, SubscriptionService } from '@b3networks/api/subscription';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ActionEventsConfigComponent } from './action-events-config/action-events-config.component';
import { AgentManagementConfigComponent } from './agent-management-config/agent-management-config.component';
import { AnnouncementConfigComponent } from './announcement-config/announcement-config.component';
import { CallSurveyComponent } from './call-survey-config/call-survey-config.component';
import { ConcurrentCallComponent } from './concurrent-call/concurrent-call.component';
import { DialPlansConfigurationComponent } from './configuration/dial-plans-configuration/dial-plans-configuration.component';
import { CreateQueueComponent, DialogCreateQueue } from './create-queue/create-queue.component';
import { DeleteQueueComponent } from './delete-queue/delete-queue.component';
import { EditQueueComponent } from './edit-queue/edit-queue.component';
import { MohConfigComponent } from './moh-config/moh-config.component';
import { NoteConfigurationComponent } from './note-configuration/note-configuration.component';
import { VoicemailCallbackComponent } from './voicemail-callback/voicemail-callback.component';

@Component({
  selector: 'b3n-queue-list',
  templateUrl: './queue-list.component.html',
  styleUrls: ['./queue-list.component.scss']
})
export class QueueListComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatSort) sort: MatSort;

  queues: QueueInfo[];
  displayColumns = ['priority', 'label', 'queueconfig', 'queuetype', 'action'];
  dataSource: MatTableDataSource<QueueInfo>;
  queryParams: QueryFilter = new QueryFilter('');
  hasOutbound = false;
  listFlow = [];
  loading: boolean;

  constructor(
    private queueService: QueueService,
    private subscriptionService: SubscriptionService,
    private flowService: FlowService,
    private orgConfigQuery: OrgConfigQuery,
    public dialog: MatDialog,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit() {
    combineLatest([
      this.subscriptionService.findSubscriptions(
        new FindSubscriptionReq({
          productIds: [environment.appId],
          embed: ['features']
        })
      ),
      this.flowService.getFlows(false),
      this.orgConfigQuery.orgConfig$
    ])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([subscriptionPage, flow, org]) => {
        subscriptionPage.data[0].items.forEach(item => {
          if (item.features.find(feature => feature.featureCode === environment.outboundFeatureCode)) {
            this.hasOutbound = true;
          }
        });
        this.initListFlowOfOrg(flow, org);
        this.reload();
      });
  }

  create() {
    const data: DialogCreateQueue = new DialogCreateQueue(false, new CreateRequest(new QueueInfo()));
    data['listFlow'] = this.listFlow;
    this.showDialog(CreateQueueComponent, data);
  }

  duplicate(queue: QueueInfo) {
    const data: DialogCreateQueue = new DialogCreateQueue(true, new CreateRequest(queue));
    this.showDialog(CreateQueueComponent, data);
  }

  delete(queue: QueueInfo) {
    this.showDialog(DeleteQueueComponent, queue);
  }

  edit(queue: QueueInfo) {
    queue['listFlow'] = this.listFlow;
    this.showDialog(EditQueueComponent, queue);
  }

  agentManagementConfig(queue: QueueInfo) {
    this.showDialog(AgentManagementConfigComponent, queue);
  }

  noteConfiguration(queue: QueueInfo) {
    this.showDialog(NoteConfigurationComponent, queue, false, { maxWidth: 700 });
  }
  showConcurrentCallConfig(queue: QueueInfo) {
    this.showDialog(ConcurrentCallComponent, queue);
  }

  mohConfig(queue: QueueInfo) {
    this.showDialog(MohConfigComponent, queue, false, { minWidth: 1000 });
  }

  announcementConfig(queue: QueueInfo) {
    this.showDialog(AnnouncementConfigComponent, queue, false);
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
    this.showDialog(VoicemailCallbackComponent, queue, false);
  }

  dialPlansConfig(queue: QueueInfo) {
    this.dialog.open(DialPlansConfigurationComponent, {
      width: '780px',
      data: queue
    });
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
    // this.spinnerService.showSpinner();
    this.loading = true;
    this.queueService
      .loadQueueList()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        res => {
          this.queues = this.getDataByFilter(res, this.queryParams);
          this.queues = this.addGenieName(this.queues);
          this.dataSource = new MatTableDataSource(this.queues);
          setTimeout(() => {
            this.dataSource.sort = this.sort;
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
    dialogCfg: any = {}
  ): MatDialogRef<T, R> {
    dialogCfg.data = data;
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
}

export class QueryFilter {
  queryString: string;
  constructor(queryString: string) {
    this.queryString = queryString;
  }
}
