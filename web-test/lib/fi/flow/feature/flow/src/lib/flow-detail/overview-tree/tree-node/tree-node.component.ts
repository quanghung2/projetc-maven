import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionType, Flow, FlowQuery, FlowService, TreeNode } from '@b3networks/api/flow';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-tree-node',
  templateUrl: './tree-node.component.html',
  styleUrls: ['./tree-node.component.scss']
})
export class TreeNodeComponent extends DestroySubscriberComponent implements OnInit, OnDestroy {
  readonly actionType = ActionType;
  @Input() node: TreeNode;
  @Input() nodeParent: TreeNode;
  @Input() isHasData: boolean;
  @Output() onSlectedData = new EventEmitter();

  pathId: string;
  flow: Flow;

  constructor(
    private router: Router,
    private flowQuery: FlowQuery,
    private flowService: FlowService,
    private activatedRoute: ActivatedRoute
  ) {
    super();
  }

  ngOnInit(): void {
    combineLatest([this.activatedRoute.queryParams, this.flowQuery.select()])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([params, flow]) => {
        this.pathId = params['pathId'];
        this.flow = flow;
      });
  }

  isActiveNode() {
    const treeNodeSelected = this.flow?.ui?.treeNodeSelected;
    if (treeNodeSelected) {
      return (
        (treeNodeSelected.showHighLightAction || this.isHasData) &&
        ((!this.node.isVisible && this.isHasData) ||
          //for path
          (treeNodeSelected.pathId === this.node?.pathId &&
            !this.node?.actionUuid &&
            this.node.nodeType === 'ACTION') ||
          //for action
          (treeNodeSelected.actionUuid === this.node?.actionUuid &&
            !this.node?.pathId &&
            this.node.nodeType === 'ACTION') ||
          // for trigger
          (treeNodeSelected.triggerDef?.triggerDefUuid === this.node.triggerDef?.triggerDefUuid &&
            !this.node?.actionUuid &&
            !this.node?.pathId &&
            this.node.nodeType === 'NORMAL_TRIGGER') ||
          //for subroutine
          (treeNodeSelected.subroutineUuid === this.node.subroutineUuid &&
            !this.node?.actionUuid &&
            !this.node?.pathId &&
            this.node.nodeType === 'SUBROUTINE_TRIGGER') ||
          // for business action
          (treeNodeSelected.nodeType === 'BUSINESS_ACTION_TRIGGER' && this.node.nodeType === 'BUSINESS_ACTION_TRIGGER'))
      );
    }
    return false;
  }

  override ngOnDestroy(): void {
    this.flowService.resetTreeNodeSelected();
    this.pathId = '';
  }

  getIcon(node: TreeNode) {
    const iconUrl = 'assets/flow-shared/icons';
    switch (node.nodeType) {
      case 'NORMAL_TRIGGER':
        return node.triggerDef.iconUrl;
      case 'SUBROUTINE_TRIGGER':
        return `${iconUrl}/shortcut.svg`;
      case 'BUSINESS_ACTION_TRIGGER':
        return `${iconUrl}/electric_bolt.svg`;
      default:
        if (node.pathId) {
          return `${iconUrl}/brandching.svg`;
        }
        switch (node.actionType) {
          case ActionType.EXTERNAL:
            return `${iconUrl}/api.svg`;
          case ActionType.DEFINE_CONSTANTS:
            return `${iconUrl}/library_add.svg`;
          case ActionType.LOOPING_ACTION:
            return `${iconUrl}/repeat.svg`;
          case ActionType.SET_SHARED_VARIABLE:
            return `${iconUrl}/upload.svg`;
          case ActionType.GET_SHARED_VARIABLE:
            return `${iconUrl}/download.svg`;
          case ActionType.INCREMENT_SHARED_VARIABLE:
            return `${iconUrl}/plus_one.svg`;
          case ActionType.PUSH_SHARED_VARIABLE:
            return `${iconUrl}/playlist_add.svg`;
          case ActionType.POP_SHARED_VARIABLE:
            return `${iconUrl}/playlist_remove.svg`;
          case ActionType.SUBROUTINE_RETURN:
            return `${iconUrl}/keyboard_return.svg`;
          case ActionType.SWITCHING:
            return `${iconUrl}/brandching.svg`;
          case ActionType.TRANSFORM:
            return `${iconUrl}/transform.svg`;
          case ActionType.API:
          case ActionType.SUBROUTINE_CALL:
            return node.actionDef.iconUrl;
        }
    }
    return '';
  }

  gotoAction(isShowEditDialog: boolean) {
    this.onSlectedData.emit();
    this.flowService.setTreeNodeSelected({
      ...this.node,
      isShowEditDialog: isShowEditDialog,
      showHighLightAction: true
    });
    if (this.pathId?.length && this.node?.pathId === this.pathId) {
      return;
    }
    if (this.node?.pathId?.length) {
      this.router.navigate([this.flow.uuid, this.flow.version], {
        relativeTo: this.activatedRoute.parent,
        queryParams: { actionUuid: this.nodeParent.actionUuid, pathId: this.node?.pathId }
      });

      return;
    }
    if (this.nodeParent?.pathId === this.pathId) {
      return;
    }
    if (this.nodeParent?.pathId?.length) {
      this.router.navigate([this.flow.uuid, this.flow.version], {
        relativeTo: this.activatedRoute.parent,
        queryParams: { actionUuid: this.node.actionUuid, pathId: this.nodeParent?.pathId }
      });

      return;
    }

    this.router.navigate([this.flow.uuid, this.flow.version], { relativeTo: this.activatedRoute.parent });
  }
}
