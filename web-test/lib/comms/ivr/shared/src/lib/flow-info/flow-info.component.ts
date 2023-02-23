import { KeyValue } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionMapping, IamQuery, IAM_GROUP_UUIDS, IdentityProfileQuery, ProfileOrg } from '@b3networks/api/auth';
import { FileService } from '@b3networks/api/file';
import {
  FillterSkillCatalog,
  SkillCatalog,
  SkillCatalogQuery,
  SkillCatalogService
} from '@b3networks/api/intelligence';
import {
  ActionType,
  Block,
  BlockRef,
  BlockService,
  BlockType,
  BlockTypeHelper,
  CallcenterQueue,
  CallcenterService,
  CallFlow,
  CallflowService,
  DestType,
  ExtensionType,
  GeneralBlockResponse,
  NodeEntry,
  RuleType,
  TransferBlock,
  Tree,
  TtsService,
  Workflow,
  WorkflowService,
  WorkflowStatus,
  WorkflowVersion
} from '@b3networks/api/ivr';
import { ConfirmDialogComponent } from '@b3networks/shared/ui/confirm-dialog';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { EventMessageService } from '@b3networks/shared/utils/message';
import * as $ from 'jquery';
import * as _ from 'lodash';
import { forkJoin, Observable, of, Subscription, timer } from 'rxjs';
import { catchError, delay, filter, finalize, map, mergeMap, switchMap, take } from 'rxjs/operators';
import { DeployScheduleComponent } from '../core/component/deploy-schedule/deploy-schedule.component';
import { StoreWorkflowComponent, StoreWorkflowInput } from '../core/component/store-workflow/store-workflow.component';
import {
  VersionHistoryComponent,
  VersionHistoryInput
} from '../core/component/version-history/version-history.component';
import { WorkflowChangedEvent } from '../core/model/workflow-changed.event';
import { BranchLabelPipe } from '../core/pipe/branch-label.pipe';
import { AppGlobal } from '../core/service/app-global';
import { FlowLoaderQcService } from '../core/service/flow-loader-qc.service';
import { GraphService, Position } from '../core/service/graph.service';
import { TreeService } from '../core/service/tree.service';
import { BlockDetailsChangedMessage } from './block-details/block-details.component';
import { MultipleBlocksDialogComponent } from './create-block/multiple/multiple.component';
import { SingleBlockData, SingleBlockDialogComponent } from './create-block/single/single.component';
import { DeleteBlockComponent, DeleteNodeData } from './delete-block/delete-block.component';
import { NextDialogComponent, NextDialogData, NextDialogResp } from './select-block/next/next.component';
import { PreviousComponent, PreviousDataReq, PreviousResp } from './select-block/previous/previous.component';
import { TestCallBeforeDeployToProductionComponent } from './test-call-before-deploy-to-production/test-call-before-deploy-to-production.component';
import { WorktimeComponent } from './worktime/worktime.component';

@Component({
  selector: 'b3n-flow-info',
  templateUrl: './flow-info.component.html',
  styleUrls: ['./flow-info.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [BranchLabelPipe]
})
export class FlowInfoComponent implements OnInit, OnDestroy {
  readonly WorkflowStatus = WorkflowStatus;
  readonly destinationRules: KeyValue<RuleType, string>[] = [
    { key: RuleType.officeHour, value: 'Office hours' },
    { key: RuleType.afterOfficeHour, value: 'After office hours' },
    { key: RuleType.publicHoliday, value: 'Public holiday' }
  ];
  readonly action = {
    deploy: 'Deploy',
    edit: 'Edit',
    request: 'RequestGoLive',
    testCall: 'TestCall'
  };

  statuses: string[] = [
    WorkflowStatus.preparing,
    WorkflowStatus.draft,
    WorkflowStatus.pending,
    WorkflowStatus.scheduled
  ];
  selectedRule: KeyValue<RuleType, string>;

  workflow: Workflow;
  workflowVersion: WorkflowVersion;
  backupWorkflowVersions: WorkflowVersion[];
  editingVersion: WorkflowVersion;

  flows: CallFlow[];
  selectedFlow: CallFlow;

  tree: Tree;

  currentBlock: Block;
  parentBlock: Block;
  ownerId: string;

  displayingBlocks: NodeEntry[] = []; // from cache
  drawingBlocks: DrawingBlock[] = []; // drawing and trigger action

  blockTypeMap = this.appGlobal.blockTypeMap;

  searchingBlockName: string;
  drawingFlow: boolean;
  loadingBlockInfo: boolean;

  exporting: boolean;
  importing: boolean;
  fetched: boolean;
  disableDragScroll = false;
  initWorkflow: Subscription;
  version: number;
  backupNumbers: string[] = [];
  backupScheduleAt: number;
  progressing: boolean;
  assignedNumbers2Workflow: string[];
  checkNumberExistsInWorkflow: boolean;
  callCenterQueues: CallcenterQueue[];
  drawingTreeCompleted: boolean;
  skills: SkillCatalog[];

  currentOrg: ProfileOrg;
  actionMapping: ActionMapping;
  hasPermissionConcept: boolean;

  enableEditFlow = true;

  private parentUuid;
  private jointJsEventHandler: any;
  private lastScrollPosition: Position;
  private lastEditBlockUuid: string;

  private workflowChangedSubscription: Subscription;

  @ViewChild(MatDrawer) blockDetailsSidebar: MatDrawer;

  constructor(
    private route: ActivatedRoute,
    private profileQuery: IdentityProfileQuery,
    private workflowService: WorkflowService,
    private ttsService: TtsService,
    private flowService: CallflowService,
    private graphService: GraphService,
    private blockService: BlockService,
    private flowLoaderService: FlowLoaderQcService,
    private treeService: TreeService,
    private callCenterService: CallcenterService,
    private branchLabelPipe: BranchLabelPipe,
    private appGlobal: AppGlobal,
    private dialog: MatDialog,
    private spinner: LoadingSpinnerSerivce,
    private eventBus: EventMessageService,
    private fileService: FileService,
    private router: Router,
    private toastService: ToastService,
    private skillCatalogService: SkillCatalogService,
    private skillCatalogQuery: SkillCatalogQuery,
    private iamQuery: IamQuery
  ) {}

  ngOnInit() {
    this.spinner.showSpinner();
    this.hasPermissionConcept = this.route.snapshot.data?.['hasPermissionConcept'];
    this.hasPermissionConcept &&
      this.iamQuery.selectActionMapping(IAM_GROUP_UUIDS.autoAttendant).subscribe(permission => {
        this.actionMapping = permission;
      });
    this.profileQuery.currentOrg$
      .pipe(
        filter(r => r != null),
        take(1)
      )
      .subscribe(currentOrg => {
        this.currentOrg = currentOrg;
      });

    this.initWorkflow = this.route.parent.params
      .pipe(
        mergeMap(params => {
          this.version = params[`version`] ? +params[`version`] : null;
          return forkJoin([
            this.workflowService.getWorkflow(params['uuid']),
            this.workflowService.getVersion(params[`uuid`]),
            this.workflowService.getVersionByStatuses(params[`uuid`], this.statuses),
            this.ttsService.getSupportVendors(),
            this.callCenterService.getCallCenterQueue()
          ]).pipe(
            finalize(() => {
              this.spinner.hideSpinner();
              this.fetched = true;
            })
          );
        })
      )
      .subscribe(async data => {
        this.workflow = data[0];
        this.assignedNumbers2Workflow = data[0].numbers;
        this.backupNumbers = data[0].numbers;

        this.backupWorkflowVersions = data[1];

        this.editingVersion =
          this.hasPermissionConcept && this.currentOrg?.licenseEnabled
            ? data[2][0]
            : data[3].length === 1
            ? data[3][0]
            : undefined;

        this.workflowVersion = this.backupWorkflowVersions.find(
          workflowVersion => workflowVersion.version === this.version
        );

        const destinations = this.workflowVersion ? this.workflowVersion.destinations : this.workflow.rule.destinations;
        const flowUuid = destinations.officeHour?.uuid;
        this.callCenterQueues = data[4];
        await this.flowService
          .getFlow(flowUuid)
          .toPromise()
          .then(
            flow => (this.selectedFlow = flow),
            err => this.toastService.error(err.message || `Cannot fetch flow. Please try again later`)
          );
        if (this.workflowVersion && this.workflowVersion.status !== WorkflowStatus.active) {
          this.workflow.rule.destinations = this.workflowVersion.destinations;
          this.workflow.numbers = [];
        }
        if (this.workflow) {
          this.selectedRule = this.destinationRules[0];
          this.onRuleChanged();
        } else {
          this.workflow = null;
          this.tree = null;
        }
      });

    this.workflowChangedSubscription = this.eventBus.message$
      .pipe(
        filter(message => message != null && message instanceof WorkflowChangedEvent),
        map(message => message as WorkflowChangedEvent)
      )
      .subscribe(message => {
        this.workflow = message.workflow;
      });

    this.fetchSkills();
  }

  fetchSkills() {
    const f: FillterSkillCatalog = this.skillCatalogQuery.getValue().ui;
    this.skillCatalogService.getSkills(f).subscribe(
      skills => {
        this.skills = skills;
      },
      err => {
        this.toastService.error(err.message);
      }
    );
  }

  ngOnDestroy() {
    if (this.jointJsEventHandler) {
      this.jointJsEventHandler._events['render:done'] = [];
      this.jointJsEventHandler = undefined;
    }
    if (this.workflowChangedSubscription) {
      this.workflowChangedSubscription.unsubscribe();
    }
    this.dialog.closeAll();
    this.initWorkflow.unsubscribe();
  }

  async onRuleChanged() {
    this.spinner.showSpinner();
    const destination = this.workflow.rule.destinations ? this.workflow.rule.destinations[this.selectedRule.key] : null;
    if (destination && destination.uuid && destination.uuid !== this.selectedFlow.uuid) {
      await this.flowService
        .getFlow(destination.uuid)
        .toPromise()
        .then(
          flow => (this.selectedFlow = flow),
          err => this.toastService.error(err.message || `Cannot fetch flows. Please try again later`)
        );
    } else if (!destination) {
      this.selectedFlow = null;
    }
    if (this.selectedFlow) {
      this.lastEditBlockUuid = null;
      this.initTree();
    }
    this.dialog.closeAll();
    this.hideSideBar();
  }

  configWorktime() {
    this.dialog
      .open(WorktimeComponent, { width: '900px', data: this.workflow, disableClose: true })
      .afterClosed()
      .subscribe(data => {
        if (data && data instanceof Workflow) {
          this.workflow = data;
        }
      });
  }

  reload(flow: CallFlow) {
    this.selectedFlow = flow;
    this.dialog.closeAll();
    this.blockDetailsSidebar.close();
    this.initTree();
  }

  blockDetailsUpdated(message: BlockDetailsChangedMessage) {
    if (message.outdatedFlowData) {
      this.reload(message.flow);
    } else {
      this.tree = message.tree;
      this.tree.nodes.forEach(node => {
        if (node.startNumber) {
          this.checkNumberExistsInWorkflow = true;
          const index = this.assignedNumbers2Workflow.indexOf(node.startNumber.split(',')[0]);
          if (index === -1) {
            this.checkNumberExistsInWorkflow = false;
          }
        }
      });
      const assignedNumbers2Block = this.tree.assignedNumbers2Block;
      this.backupNumbers = this.assignedNumbers2Workflow.filter(number => assignedNumbers2Block.indexOf(number) == -1);
      this.selectedFlow = message.flow ? message.flow : this.selectedFlow;

      this.displayingBlocks = this.flowLoaderService.addBlocks(
        this.tree,
        this.displayingBlocks,
        message.parentNode,
        message.addedNodes
      );

      this.flowLoaderService.saveFlowInCookie(this.displayingBlocks, this.selectedFlow);
      this.displayFlow();
    }
  }

  onFocusBlock(block?: NodeEntry) {
    this.getInvolvedBlocks(block);
  }

  showMiddlePopup(block: NodeEntry) {
    this.dialog.closeAll();
    const blockDiv = document.getElementById(block.uuid);
    this.fetchInvolvedBlocksFromServer(block).subscribe(data => {
      this.parentBlock = data.parentBlock;
      this.currentBlock = data.block;
      const dialogRef = this.dialog.open(PreviousComponent, {
        data: <PreviousDataReq>{
          block: data.block,
          parentBlock: data.parentBlock
        },
        width: '280px',
        autoFocus: false,
        hasBackdrop: false,
        position: {
          top: blockDiv.getBoundingClientRect().top + 60 + 'px',
          left: blockDiv.getBoundingClientRect().left - 30 + 'px'
        }
      });
      this.disableDragScroll = true;
      dialogRef.afterClosed().subscribe((result: PreviousResp) => {
        this.disableDragScroll = false;
        if (result && result.blockType) {
          this.openAddSingleBlock(this.parentBlock, result.blockType, block.uuid);
        }
      });
    });
  }

  showDeletePopup(node: NodeEntry) {
    const parentNode: NodeEntry = this.treeService.getParent(node, this.tree);
    if (parentNode) {
      this.parentUuid = parentNode.uuid;
    } else {
      this.parentUuid = undefined;
    }

    const dialogRef = this.dialog.open(DeleteBlockComponent, {
      maxWidth: '500px',
      data: <DeleteNodeData>{
        flow: this.selectedFlow,
        parentUuid: this.parentUuid,
        deletingUuid: node.uuid,
        leafNode: node.refs.length === 0,
        multipleBranchNode: BlockTypeHelper.isMultipleBranchBlock(node.type),
        workFlowUuid: this.workflow.uuid,
        version: this.version || -1,
        tree: this.tree
      }
    });

    dialogRef.afterClosed().subscribe((data: GeneralBlockResponse) => {
      if (data) {
        this.hideSideBar();

        if (data.isSuccess) {
          this.selectedFlow = data.flow;

          const deletedNodes = this.treeService.getDeletedBlocks(data.tree, this.tree);
          this.tree = data.tree;
          this.displayingBlocks = this.flowLoaderService.removeBlocks(this.tree, this.displayingBlocks, deletedNodes);

          this.displayFlow(true);
          this.dialog.closeAll();
        }
      }
    });
  }

  showDetailsSideBar() {
    this.blockDetailsSidebar.open();
  }

  toggleFlowAt(block: DrawingBlock) {
    if (block.hasExpand) {
      this.displayingBlocks = this.flowLoaderService.loadNextStepsOfBlock(this.tree, this.displayingBlocks, block);
    }

    if (block.hasCollapse) {
      this.displayingBlocks = this.flowLoaderService.unloadNextStepsOfBlock(this.displayingBlocks, block);
    }

    this.flowLoaderService.saveFlowInCookie(this.displayingBlocks, this.selectedFlow);

    this.drawGraph();
    this.moveScreenToBlock(block.uuid);
    if (this.jointJsEventHandler) {
      this.jointJsEventHandler._events['render:done'] = [];
      this.jointJsEventHandler = undefined;
    }
  }

  searchBlock(event) {
    if (!this.searchingBlockName) {
      this.toastService.warning('Please enter block name!');
      return;
    }

    if ('incoming block'.indexOf(this.searchingBlockName.toLowerCase()) > -1) {
      this.onFocusBlock();
      return;
    }

    const node: NodeEntry = _.find(this.tree.nodes, (item: NodeEntry) => {
      return item.label.toLowerCase().includes(this.searchingBlockName.toLowerCase());
    });

    if (node) {
      this.onFocusBlock(node);
      return;
    }
    this.toastService.error('Block' + ' ' + this.searchingBlockName + ' not found!');
  }

  importFlow(event) {
    if (this.importing) {
      return;
    }

    this.importing = true;
    this.hideSideBar();

    const file = event.target.files[0];

    this.flowService.importFlow(this.selectedFlow.uuid, file).subscribe(
      (data: any) => {
        this.importing = false;
        this.clearGraph(true);

        this.tree = Object.assign(new Tree(), data.tree);

        this.selectedFlow = data.flow ? Object.assign(new CallFlow(), data.flow) : this.selectedFlow;

        this.displayFlow();
      },
      (err: any) => {
        this.importing = false;
        this.toastService.error('Unexpected error happened while exporting flow. Please try again later.');
      }
    );
  }

  hideSideBar() {
    this.blockDetailsSidebar.close();
  }

  editName() {
    this.dialog
      .open(StoreWorkflowComponent, {
        width: '500px',
        data: <StoreWorkflowInput>{
          workflow: this.workflow,
          type: ActionType.rename,
          updateLabelOnly: true
        }
      })
      .afterClosed()
      .subscribe(res => {
        // if (data && data instanceof Workflow) {
        //   this.getData();
        // }
      });
  }

  exportFlow() {
    this.exporting = true;
    this.flowService
      .exportFlow(this.selectedFlow.uuid)
      .pipe(finalize(() => (this.exporting = false)))
      .subscribe(
        data => {
          const blob = new Blob([data], { type: 'application/octet-stream' });
          const url = window.URL.createObjectURL(blob);
          this.download(`${this.selectedFlow.uuid}.json`, url);
        },
        error => {
          this.toastService.error('Unexpected Error happened while exporting flow. Please try again later.');
        }
      );
  }

  deploySchedule() {
    this.backupScheduleAt = this.workflowVersion.scheduledAt;
    this.dialog
      .open(DeployScheduleComponent, {
        minWidth: `450px`,
        autoFocus: false,
        data: { workflowVersion: this.workflowVersion }
      })
      .afterClosed()
      .subscribe(workflowVersion => {
        if (workflowVersion && workflowVersion instanceof WorkflowVersion) {
          this.workflowVersion = workflowVersion;
          this.editingVersion = workflowVersion;
          if (workflowVersion.status === WorkflowStatus.active) {
            this.workflow.numbers = this.backupNumbers;
          }
        } else {
          this.workflowVersion.scheduledAt = this.backupScheduleAt;
        }
      });
  }

  private clearGraph(clearAll?: boolean) {
    this.searchingBlockName = undefined;
    this.graphService.clearGraph(clearAll);
    if (clearAll) {
      this.drawingFlow = false;
      this.drawingBlocks = [];
    }
  }

  requestGoLive(workflow: Workflow) {
    this.dialog
      .open(ConfirmDialogComponent, {
        minWidth: `400px`,
        data: {
          title: `Request go live`,
          message: `Please make sure this flow is tested.`,
          confirmLabel: `Request`
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.spinner.showSpinner();
          this.workflowService
            .requestGoLive(this.workflow.uuid)
            .pipe(finalize(() => this.spinner.hideSpinner()))
            .subscribe(
              workflowVersion => {
                this.workflowVersion = workflowVersion;
                this.editingVersion = workflowVersion;
                this.toastService.success(`Requested successfully!`);
              },
              err => {
                this.toastService.error(`Cannot send request. Please try again later!`);
              }
            );
        }
      });
  }

  async createDraftVersion(workflow: Workflow) {
    this.progressing = true;
    const result: WorkflowVersion[] = await this.workflowService
      .getVersionByStatuses(workflow.uuid, this.statuses)
      .toPromise();
    this.editingVersion = result.length === 1 ? result[0] : undefined;

    if (this.editingVersion && this.editingVersion.status === WorkflowStatus.draft) {
      this.progressing = false;
      this.router.navigate(
        ['config', { uuid: this.editingVersion.workFlowUuid, version: this.editingVersion.version }],
        { relativeTo: this.route.parent.parent }
      );
      return;
    } else if (this.editingVersion && this.editingVersion.status !== WorkflowStatus.draft) {
      this.progressing = false;
      return;
    }

    if (result.length === 0) {
      this.workflowService.createDraftVersion(workflow.uuid).subscribe(
        workflowVersion => {
          if (workflowVersion && workflowVersion instanceof WorkflowVersion) {
            timer(0, 3000)
              .pipe(
                mergeMap(_ => {
                  return this.workflowService.getVersionByStatuses(workflow.uuid, [`draft`]);
                })
              )
              .pipe(finalize(() => (this.progressing = false)))
              .pipe(filter(data => data.length > 0))
              .pipe(take(1))
              .subscribe(data => {
                this.editingVersion = data[0];
                this.router.navigate(
                  ['config', { uuid: this.editingVersion.workFlowUuid, version: this.editingVersion.version }],
                  { relativeTo: this.route.parent.parent }
                );
              });
          }
        },
        err => {
          this.toastService.error(err.message || `Cannot create draft version. Please try again later!`);
        }
      );
    }
  }

  openMp3(block: DrawingBlock) {
    this.spinner.showSpinner();
    this.blockService.getBlock(this.selectedFlow, block.uuid).subscribe(block => {
      this.replaceURL(block);
    });
  }

  private parseMessage(dest: string, type: BlockType): string {
    if (!dest && type === BlockType.transfer) {
      return 'Forward back to SIM';
    }
    if (type !== BlockType.transfer) return dest;
    const queueMap = this.callCenterQueues.reduce((queueMap, queue) => {
      queueMap[queue.uuid] = queue;
      return queueMap;
    }, {});
    const queue = queueMap[dest];
    return queue ? `Queue ` + queue[`label`] : dest;
  }

  openVersionHistoryDialog() {
    this.dialog
      .open(VersionHistoryComponent, {
        minWidth: `800px`,
        minHeight: `400px`,
        data: <VersionHistoryInput>{
          workflow: this.workflow,
          isAdmin: this.currentOrg.isAdmin,
          currentVersion: this.version
        }
      })
      .afterClosed()
      .subscribe(workflowVersion => {
        if (workflowVersion && workflowVersion instanceof WorkflowVersion) {
          this.workflowVersion = workflowVersion;
          this.editingVersion = workflowVersion;
          if (workflowVersion.status === WorkflowStatus.active) {
            this.workflow.numbers = this.backupNumbers;
          }
          this.router.navigate(
            ['config', { uuid: this.workflowVersion.workFlowUuid, version: this.workflowVersion.version }],
            { relativeTo: this.route.parent.parent }
          );
          if (!workflowVersion.status) {
            this.workflowService.getVersionByStatuses(this.workflow.uuid, this.statuses).subscribe(wvs => {
              this.editingVersion = wvs.length === 1 ? wvs[0] : undefined;
            });
          } else {
          }
        }
      });
  }

  cancelRequest() {
    let messege, title: string;

    if (this.hasPermissionConcept && this.currentOrg?.licenseEnabled && !this.currentOrg.isUpperAdmin) {
      this.enableEditFlow = true;
    }

    if (!this.currentOrg.isAdmin) {
      title = this.workflowVersion.status === WorkflowStatus.pending ? `Cancel request go live` : `Cancel schedule`;
      messege =
        this.workflowVersion.status === WorkflowStatus.pending
          ? `Are you sure to cancel request go live <strong>version ${this.workflowVersion.version}.0?</strong>`
          : `Are you sure to cancel schedule <strong>version ${this.workflowVersion.version}.0?</strong>`;
    } else {
      title = this.workflowVersion.status === WorkflowStatus.pending ? `Reject request go live` : `Cancel schedule`;
      messege =
        this.workflowVersion.status === WorkflowStatus.pending
          ? `Are you sure to reject request go live <strong>version ${this.workflowVersion.version}.0?</strong>`
          : `Are you sure to cancel schedule <strong>version ${this.workflowVersion.version}.0?</strong>`;
    }
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: `400px`,
      data: {
        message: messege,
        title: title
      }
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.spinner.showSpinner();
        this.workflowService
          .rejectVersion(this.workflowVersion.workFlowUuid)
          .pipe(finalize(() => this.spinner.hideSpinner()))
          .subscribe(
            workflowVersion => {
              const oldWorkflowVersion = this.workflowVersion;
              this.workflowVersion = workflowVersion;
              this.toastService.success(
                this.currentOrg.isAdmin && oldWorkflowVersion.status === WorkflowStatus.pending
                  ? `Rejected successfully!`
                  : `Canceled  successfully!`
              );
            },
            error1 =>
              this.toastService.error(
                error1.message || `Cannot cancel request go live/ schedule. Please try again later!`
              )
          );
      }
    });
  }

  testCallFlow() {
    this.dialog.open(TestCallBeforeDeployToProductionComponent, {
      width: `420px`,
      data: { workflow: this.workflow, user: this.currentOrg, numbers: this.backupNumbers }
    });
  }

  private drawGraph() {
    this.drawingFlow = true;

    this.clearGraph();

    const incomingBlock = this.graphService.addSVGBlock('incoming-block');
    const rootBlock = this.graphService.addSVGBlock(this.tree.firstBlockUuid);
    this.graphService.addBlockConnectionLink(incomingBlock, rootBlock);

    _.forEach(this.displayingBlocks, (block: NodeEntry) => {
      this.graphService.addSVGBlock(block.uuid);
    });

    _.forEach(this.displayingBlocks, (block: NodeEntry) => {
      _.forEach(block.refs, (ref: BlockRef) => {
        const nextBlock = _.find(this.displayingBlocks, (item: NodeEntry) => {
          return item.uuid === ref.nextBlockUuid;
        });
        if (nextBlock) {
          this.graphService.addBlockConnectionLink(
            this.graphService.getGraphElementById(block.uuid),
            this.graphService.getGraphElementById(ref.nextBlockUuid)
          );
        }
      });
    });

    this.graphService.drawGraph();
    this.updateDrawingBlocks();
    this.drawingFlow = false; //replaced for drew stream
  }

  replaceURL(block) {
    const tts = block.tts.entries[0];
    if (tts.s3Key && !!tts.s3Key) {
      this.fileService
        .getDownloadFileUrl(tts.s3Key)
        .pipe(finalize(() => this.spinner.hideSpinner()))
        .subscribe(url => {
          tts.url = url.url;
          window.open(url.url, '_blank');
        });
    } else {
      this.spinner.hideSpinner();
      window.open(tts.url, '_blank');
    }
  }

  private openAddSingleBlock(parentBlock: Block, blockType, childBlockUuid) {
    const singleBlockData = <SingleBlockData>{
      flow: this.selectedFlow,
      type: blockType,
      parentBlock: parentBlock,
      maxId: this.blockService.generateBlockUuid(this.tree.nodes),
      childBlockUuid: childBlockUuid,
      tree: this.tree,
      workflowUuid: this.workflow.uuid,
      version: this.workflowVersion ? this.workflowVersion.version : -1,
      skills: this.skills || [],
      isDevice: this.workflow?.numberList?.find(num => num.isDevice) ? true : false,
      workflow: this.workflow
    };

    const dialogRef = this.dialog.open(SingleBlockDialogComponent, {
      data: singleBlockData,
      width: '550px',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((result: UpdateBlockInput) => {
      if (result && !result.outdatedFlowData) {
        this.updateBlock(result);
      } else if (result && result.outdatedFlowData) {
        this.reload(result.flow);
      }
    });
  }

  private openAddMultipleBlock(parentBlock: Block) {
    const dialRef = this.dialog.open(MultipleBlocksDialogComponent, {
      data: <SingleBlockData>{
        type: this.currentBlock.type,
        flow: this.selectedFlow,
        parentBlock: parentBlock,
        maxId: this.blockService.generateBlockUuid(this.tree.nodes),
        tree: this.tree,
        workflowUuid: this.workflow.uuid,
        version: this.workflowVersion ? this.workflowVersion.version : -1,
        skills: this.skills || [],
        isDevice: this.workflow?.numberList?.find(num => num.isDevice) ? true : false,
        workflow: this.workflow
      },
      width: '800px',
      autoFocus: false
    });
    dialRef.afterClosed().subscribe((result: UpdateBlockInput) => {
      if (result && !result.outdatedFlowData) {
        this.updateBlock(result);
      } else if (result && result.outdatedFlowData) {
        this.reload(result.flow);
      }
    });
  }

  private displayFlow(isDeleteAction?: boolean) {
    if (this.tree.nodes.length > 0) {
      this.flowLoaderService.markLevel(this.tree);
      this.displayingBlocks = this.flowLoaderService.loadFlowFromCookie(this.tree, this.selectedFlow, 7);
      this.flowLoaderService.saveFlowInCookie(this.displayingBlocks, this.selectedFlow);

      this.drawGraph();
    } else {
      this.spinner.hideSpinner();
      this.drawingTreeCompleted = true;
      $('#incoming-block').css({
        top: '0px'
      });
      this.moveScreenToBlock('incoming-block');
      this.clearGraph(true);
    }
  }

  private download(filename, url) {
    const element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  private updateBlock(data: UpdateBlockInput) {
    this.tree = data.tree;
    this.selectedFlow = data.flow;

    const parentNode = data.parentNode;
    const addedNodes = data.addedNodes;

    this.displayingBlocks = this.flowLoaderService.addBlocks(this.tree, this.displayingBlocks, parentNode, addedNodes);
    this.flowLoaderService.saveFlowInCookie(this.displayingBlocks, this.selectedFlow);

    this.displayFlow();
  }

  private validateAndReloadFlow(flow: CallFlow): boolean {
    if (!!flow && flow.updatedAt - this.selectedFlow.updatedAt > 1000) {
      this.toastService.warning('Flow has been changed. Reloading flow...');
      this.reload(flow);
      return false;
    }
    return true;
  }

  routingNewVersion() {
    this.router.navigate(['config', { uuid: this.editingVersion.workFlowUuid, version: this.editingVersion.version }], {
      relativeTo: this.route.parent.parent
    });
  }

  private fetchInvolvedBlocksFromServer(node: NodeEntry): Observable<InvolvedBlockResp> {
    this.loadingBlockInfo = true;
    const parentNode: NodeEntry = this.treeService.getParent(node, this.tree);

    return of(parentNode).pipe(
      mergeMap(parent => {
        if (parent) {
          return forkJoin([
            this.blockService.getBlock(this.selectedFlow, parent.uuid),
            this.blockService.getBlock(this.selectedFlow, node.uuid),
            this.flowService.getFlow(this.selectedFlow.uuid)
          ]);
        } else {
          return forkJoin([
            of(undefined),
            this.blockService.getBlock(this.selectedFlow, node.uuid),
            this.flowService.getFlow(this.selectedFlow.uuid)
          ]);
        }
      }),
      catchError(error => {
        this.loadingBlockInfo = false;
        return error;
      }),
      mergeMap(data => {
        if (!this.validateAndReloadFlow(data[2])) {
          this.loadingBlockInfo = false;
          return of(<InvolvedBlockResp>{
            parentBlock: data[0],
            block: data[1]
          }).pipe(delay(100));
        }
        this.loadingBlockInfo = false;
        return of(<InvolvedBlockResp>{
          parentBlock: data[0],
          block: data[1]
        });
      })
    );
  }

  private moveScreenToBlock(blockUuid: string) {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (!blockUuid) {
          return;
        }

        try {
          const flowDiv = document.getElementById('flow-content');
          const blockDiv = document.getElementById(blockUuid);
          if (blockDiv) {
            if (!this.lastScrollPosition) {
              this.lastScrollPosition = new Position();
            }

            const scrollTop = blockDiv.offsetTop - flowDiv.offsetTop / 2 - 120;
            const scrollLeft = blockDiv.offsetLeft - flowDiv.offsetLeft / 2 - 540;

            const distance = Math.sqrt(
              Math.pow(scrollTop - this.lastScrollPosition.getY(), 2) +
                Math.pow(scrollLeft - this.lastScrollPosition.getX(), 2)
            );
            const duration = Math.min(Math.max(150, Math.ceil(distance / 2)), 350);
            this.lastScrollPosition.x = `${scrollLeft}px`;
            this.lastScrollPosition.y = `${scrollTop}px`;
            $('.drag-scroll-content').animate(
              {
                scrollTop: scrollTop,
                scrollLeft: scrollLeft
              },
              duration,
              'linear',
              function () {
                resolve();
              }
            );
            this.lastEditBlockUuid = blockUuid;
          }
        } catch (e) {
          reject(e);
          console.error(e);
        }
      }, 0);
    });
  }

  private initTree() {
    this.clearGraph(true);
    this.drawingTreeCompleted = false;
    if (this.jointJsEventHandler) {
      this.jointJsEventHandler._events['render:done'] = [];
      this.jointJsEventHandler = undefined;
    }

    this.flowService.getFlowTree(this.selectedFlow.uuid).subscribe(
      data => {
        this.tree = data;
        this.backupNumbers = this.assignedNumbers2Workflow.filter(
          number => this.tree.assignedNumbers2Block.indexOf(number) === -1
        );
        this.tree.nodes.forEach(node => {
          if (node.startNumber) {
            this.checkNumberExistsInWorkflow = true;
            const index = this.assignedNumbers2Workflow.indexOf(node.startNumber.split(',')[0]);
            if (index === -1) {
              this.checkNumberExistsInWorkflow = false;
            }
          }
        });
        setTimeout(() => {
          const paper = this.graphService.initGraph('flow-graph-paper', 1800, 1600);
          this.jointJsEventHandler = paper.on({
            'render:done': () => {
              let node: NodeEntry;
              try {
                node = _.find(this.tree.nodes, (item: NodeEntry) => {
                  return item.uuid === this.lastEditBlockUuid;
                });
                this.onFocusBlock(node);
              } catch (e) {}
              this.onFocusBlock(node);
            }
          });
          this.displayFlow();
        }, 100);
      },
      err => {
        this.toastService.error('Error while fetching flow information.');
        this.spinner.hideSpinner();
      }
    );
  }

  private getInvolvedBlocks(node?: NodeEntry) {
    if (this.loadingBlockInfo) {
      return;
    }

    if (!node) {
      this.moveScreenToBlock('incoming-block');
      this.dialog.closeAll();
      const blockDiv = document.getElementById('incoming-block');
      if (this.tree.nodes.length === 0) {
        if (this.workflow.numbers.length > 0) return;
        const dialogRef = this.dialog.open(NextDialogComponent, {
          width: '280px',
          position: {
            top: blockDiv.getBoundingClientRect().top + 'px',
            left: blockDiv.getBoundingClientRect().left + 150 + 'px'
          },
          autoFocus: false,
          hasBackdrop: false,
          data: <NextDialogData>{
            tree: this.tree,
            flow: this.selectedFlow,
            block: undefined,
            ownerId: 'incoming-block'
          }
        });
        this.disableDragScroll = true;
        dialogRef.afterClosed().subscribe((data: NextDialogResp) => {
          this.disableDragScroll = false;
          if (data && data.nextType === 'single') {
            this.openAddSingleBlock(undefined, data.blockType, undefined);
          } else if (data && data.nextType === 'multiple') {
            this.openAddMultipleBlock(this.currentBlock);
          }
        });
      }
      return;
    }

    this.fetchInvolvedBlocksFromServer(node).subscribe(
      async data => {
        this.parentBlock = data.parentBlock;
        this.currentBlock = data.block;
        this.loadingBlockInfo = false;
        await this.moveScreenToBlock(node.uuid);
        await this.showNextDialog(node);
        this.showDetailsSideBar();
      },
      error => {
        this.toastService.error(error.message);
      }
    );
  }

  private updateDrawingBlocks() {
    this.drawingBlocks = [];

    setTimeout(() => {
      const position: Position = this.graphService.getGraphElementPos('incoming-block');
      $('#incoming-block').css({
        top: position.y,
        left: position.x
      });

      _.forEach(this.displayingBlocks, (node: NodeEntry) => {
        const drawingBlock: DrawingBlock = new DrawingBlock({
          uuid: node.uuid,
          label: node.label,
          type: node.type,
          level: node.level,
          refs: node.refs,
          startNumber: node.startNumber
        });
        drawingBlock.position = this.graphService.getGraphElementPos(node.uuid);
        drawingBlock.title = this.blockTypeMap[node.type];
        drawingBlock.message = this.parseMessage(node.message, node.type);

        const hasChildrenNotDisplayed = this.treeService.getDirectChildren(node, this.tree).length > 0; // if node has children in tree
        if (hasChildrenNotDisplayed) {
          drawingBlock.hasExpand = true;
          drawingBlock.hasCollapse = false;
        }

        const hasChildrenDisplaying =
          this.treeService.getDirectChildren(
            node,
            new Tree({
              firstBlockUuid: this.tree.firstBlockUuid,
              nodes: this.displayingBlocks
            })
          ).length > 0; // if node has children in displaying node list
        if (hasChildrenDisplaying) {
          drawingBlock.hasExpand = false;
          drawingBlock.hasCollapse = true;
        }

        const parent: NodeEntry = this.treeService.getParent(node, this.tree);
        if (parent) {
          drawingBlock.isABranch = BlockTypeHelper.isMultipleBranchBlock(parent.type);

          if (parent.type === BlockType.gather) {
            drawingBlock.isGatherChild = true;
          }

          if (parent.type === BlockType.transfer) {
            drawingBlock.isTransferChild = true;
          }

          drawingBlock.refLabel = this.branchLabelPipe.transform(node.uuid, parent.refs, parent.type, true);
        }

        this.drawingBlocks.push(drawingBlock);
      });
      this.spinner.hideSpinner();
      this.drawingTreeCompleted = true;
    }, 0);
  }

  returnActiveVersion() {
    this.router.navigate(['config', { uuid: this.workflow.uuid }], {
      relativeTo: this.route.parent.parent
    });
  }

  checkMessageFlow(isUpperAdmin: boolean): boolean {
    if (this.hasPermissionConcept && this.currentOrg.licenseEnabled) {
      return isUpperAdmin
        ? this.currentOrg.isUpperAdmin || this.actionMapping?.[this.action.deploy]
        : this.isOnlyActionPermission(this.action.edit);
    } else {
      return isUpperAdmin ? this.currentOrg.isUpperAdmin : !this.currentOrg.isUpperAdmin;
    }
  }

  checkLicensePermission(action: string): boolean {
    return this.hasPermissionConcept && this.currentOrg.licenseEnabled
      ? this.checkWithAppCPAAS(action)
      : this.checkWithAppModel(action);
  }

  private checkWithAppCPAAS(action: string): boolean {
    switch (action) {
      case this.action.request:
        return this.isOnlyActionPermission(this.action.edit);
      case this.action.deploy:
        return (
          this.actionMapping?.[action] &&
          (this.isOnlyActionPermission(this.action.deploy)
            ? this.workflowVersion?.status === WorkflowStatus.pending
            : this.workflowVersion?.status === WorkflowStatus.draft ||
              this.workflowVersion?.status === WorkflowStatus.pending)
        );
      case this.action.testCall:
        return this.checkTestCallFlow();
      default:
        return this.actionMapping?.[action];
    }
  }

  private checkWithAppModel(action: string): boolean {
    switch (action) {
      case this.action.testCall:
        return (
          !this.workflow.numbers?.length &&
          this.backupNumbers &&
          this.workflowVersion &&
          (this.workflowVersion?.status === WorkflowStatus.draft ||
            this.workflowVersion?.status === WorkflowStatus.pending)
        );
      case this.action.deploy:
        return this.currentOrg?.isUpperAdmin;
      default:
        return true;
    }
  }

  private checkTestCallFlow(): boolean {
    if (
      this.workflow.numbers?.length > 0 &&
      !this.currentOrg.isUpperAdmin &&
      (this.isOnlyActionPermission(this.action.deploy) || this.hasRequestGoLive())
    ) {
      this.enableEditFlow = false;
    }
    if (this.actionMapping?.[this.action.deploy] && this.actionMapping?.[this.action.edit]) {
      this.enableEditFlow = true;
    }

    return (
      (this.backupNumbers?.length > 0 && !this.hasRequestGoLive() && this.isOnlyActionPermission(this.action.deploy)) ||
      this.workflowVersion?.status === WorkflowStatus.draft ||
      this.workflowVersion?.status === WorkflowStatus.pending
    );
  }

  private isOnlyActionPermission(action) {
    return action === this.action.deploy
      ? this.actionMapping?.[this.action.deploy] && !this.actionMapping?.[this.action.edit]
      : this.actionMapping?.[this.action.edit] && !this.actionMapping?.[this.action.deploy];
  }

  private hasRequestGoLive(): boolean {
    return this.workflow.numbers?.length > 0 && this.editingVersion?.status === WorkflowStatus.pending;
  }

  private showNextDialog(block) {
    return new Promise<void>(resolve => {
      if (
        this.workflow.numbers.length > 0 ||
        (this.workflowVersion &&
          this.workflowVersion.status !== WorkflowStatus.draft &&
          !(this.currentOrg.isAdmin && this.workflowVersion.status === WorkflowStatus.pending))
      ) {
        resolve();
        return;
      }
      const blockDiv = document.getElementById(block.uuid);
      this.dialog.closeAll();
      this.fetchInvolvedBlocksFromServer(block).subscribe(data => {
        this.currentBlock = data.block;
        this.parentBlock = data.parentBlock;
        if (
          this.currentBlock &&
          ((this.tree.nodes.length > 0 &&
            !BlockTypeHelper.isMultipleBranchBlock(this.currentBlock.type) &&
            this.currentBlock.nextBlocks.length > 0) ||
            (this.currentBlock instanceof TransferBlock &&
              (this.currentBlock.dest.type === DestType.callcenter ||
                (this.currentBlock.dest.type === DestType.bizphone &&
                  this.currentBlock.dest.extType === ExtensionType.CONFERENCE))))
        ) {
          resolve();
          return;
        }

        if (this.currentBlock) {
          this.ownerId = this.currentBlock.uuid;
        } else {
          this.ownerId = 'incoming-block';
        }

        if (!this.dialog.afterOpened.closed) {
          this.dialog.closeAll();
        }

        const dialogRef = this.dialog.open(NextDialogComponent, {
          position: {
            top: blockDiv.getBoundingClientRect().top + 'px',
            left: blockDiv.getBoundingClientRect().left + 150 + 'px'
          },
          autoFocus: false,
          backdropClass: 'cdk-overlay-transparent-backdrop',
          disableClose: false,
          data: <NextDialogData>{
            tree: this.tree,
            flow: this.selectedFlow,
            block: this.currentBlock,
            ownerId: this.ownerId
          }
        });

        this.disableDragScroll = true;
        dialogRef
          .afterOpened()
          .pipe(
            switchMap(() => {
              resolve();
              return dialogRef.afterClosed();
            })
          )
          .subscribe((data: NextDialogResp) => {
            this.disableDragScroll = false;
            if (data && data.nextType === 'single') {
              this.openAddSingleBlock(this.currentBlock, data.blockType, undefined);
            } else if (data && data.nextType === 'multiple') {
              this.openAddMultipleBlock(this.currentBlock);
            }
          });
      });
    });
  }
}

export class DrawingBlock extends NodeEntry {
  title: string;
  refLabel: string;
  isGatherChild: boolean;
  isTransferChild: boolean;
  isABranch: boolean;
  hasExpand: boolean;
  hasCollapse: boolean;
  position: Position = new Position();

  get info() {
    if (this.refLabel.includes(`Digit equals to`)) {
      return this.refLabel.replace(`Digit equals to`, ``);
    } else if (this.refLabel.includes(`Any digit with max`)) {
      return `any`;
    } else if (this.refLabel.includes(`No digit`)) {
      return `no`;
    } else if (this.refLabel.includes(`Digit exists in upload file`)) {
      return `multiple`;
    } else if (this.refLabel.includes(`Digit matches regex`)) {
      return `regex`;
    }
    return '';
  }

  constructor(obj?: Partial<DrawingBlock>) {
    super(obj);
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface InvolvedBlockResp {
  parentBlock: Block;
  block: Block;
}

export interface UpdateBlockInput {
  flow: CallFlow;
  tree?: Tree;
  parentNode?: NodeEntry;
  addedNodes?: NodeEntry[];
  outdatedFlowData?: boolean;
}
