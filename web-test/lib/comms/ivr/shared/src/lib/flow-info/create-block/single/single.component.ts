import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SkillCatalog } from '@b3networks/api/intelligence';
import {
  Block,
  BlockBuilder,
  BlockService,
  BlockType,
  CallFlow,
  DestType,
  ExtensionType,
  NodeEntry,
  TransferBlock,
  Tree,
  Workflow
} from '@b3networks/api/ivr';
import { USER_INFO, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import * as _ from 'lodash';
import { finalize } from 'rxjs/operators';
import { AppGlobal } from '../../../core/service/app-global';
import { ValidCheckService } from '../../../core/service/valid-check.service';
import { InvalidText } from '../../block-details/block-details.component';
import { UpdateBlockInput } from '../../flow-info.component';

@Component({
  selector: 'b3n-single',
  templateUrl: './single.component.html',
  styleUrls: ['./single.component.scss']
})
export class SingleBlockDialogComponent implements OnInit {
  block: Block;
  parentBlock: Block;
  blockTypeMap = this.appGlobal.blockTypeMap;
  tree: Tree;

  saving: boolean;
  isLoading: boolean;
  isE164numberInvalid: boolean;

  BlockType = BlockType;
  skills: SkillCatalog[];
  isDevice: boolean;

  constructor(
    public dialogRef: MatDialogRef<SingleBlockDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SingleBlockData,
    private blockService: BlockService,
    private appGlobal: AppGlobal,
    private toastService: ToastService,
    private validCheckService: ValidCheckService
  ) {}

  ngOnInit() {
    this.isDevice = this.data.isDevice;
    this.skills = this.data.skills;
    this.parentBlock = this.data.parentBlock;
    this.tree = this.data.tree;
    const blockId = this.data.maxId + 1;
    this.block = BlockBuilder.createNewBlock(
      this.data.type,
      this.data.flow,
      blockId,
      X.getContext()[USER_INFO.orgUuid]
    );
    if (this.data.childBlockUuid) {
      this.blockService.addBranch(this.data.childBlockUuid, this.block);
    }

    if (this.data.parentBlock && !this.data.childBlockUuid) {
      // insert next
      this.blockService.addBranch(this.block.uuid, this.parentBlock);
    } else if (this.data.parentBlock && this.data.childBlockUuid) {
      // insert middle
      if (
        this.data.parentBlock.type === 'notification' &&
        this.data.parentBlock.webHookCommand &&
        this.data.parentBlock.webHookCommand.method == null
      ) {
        this.data.parentBlock.webHookCommand = undefined;
      }
      this.blockService.updateBranch(this.data.childBlockUuid, this.block.uuid, this.parentBlock);
    }

    this.validCheckService.isInvalidStransferForm$.subscribe(isInvalid => {
      setTimeout(() => {
        this.isE164numberInvalid = isInvalid;
      }, 100);
    });
  }

  onBlockChange(block: Block) {
    this.block = block;
  }
  save() {
    if (this.saving) {
      return;
    }

    if (!this.preValidateBeforeSaving()) {
      this.toastService.error(
        'Current call forwarding setting cannot contain any next step. Please delete all blocks behind before saving.'
      );
      return;
    }
    if (
      this.block instanceof TransferBlock &&
      this.block.dest.numbers.length === 0 &&
      this.block.dest.type === DestType.number
    ) {
      this.toastService.warning(`Please enter a phone number!`);
      return;
    }
    this.saving = true;
    this.blockService
      .saveBlock(this.data.flow, this.data.parentBlock, [this.block], this.data.workflowUuid, this.data.version)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        data => {
          this.saving = false;
          if (data.isSuccess) {
            let parentNode: NodeEntry;
            if (this.data.parentBlock) {
              parentNode = _.find(data.tree.nodes, (node: NodeEntry) => {
                return node.uuid === this.data.parentBlock.uuid;
              });
            }
            const addedNodes: NodeEntry[] = _.filter(data.tree.nodes, (node: NodeEntry) => {
              return node.uuid === this.block.uuid;
            });

            this.toastService.success('Added block successfully!');
            this.dialogRef.close(<UpdateBlockInput>{
              tree: data.tree,
              parentNode: parentNode,
              addedNodes: addedNodes,
              flow: data.flow
            });
          } else if (data.isOutdatedFlow) {
            this.dialogRef.close(<UpdateBlockInput>{
              flow: data.flow,
              outdatedFlowData: true
            });
          } else {
            this.toastService.error('Error happened while saving block.');
          }
        },
        (err: any) => {
          if (err.error && err.error.errors) {
            this.toastService.error('Validate failure. Please correct the invalid fields.');
          } else if (err.code === InvalidText.code) {
            this.toastService.warning(InvalidText.message);
          } else {
            this.toastService.error('Unexpected error happened while saving block.');
            this.dialogRef.close();
          }
        }
      );
  }

  private preValidateBeforeSaving(): boolean {
    let result = true;
    if (this.block instanceof TransferBlock && this.block.nextBlocks.length > 0) {
      if (this.block.dest.type === DestType.callcenter || this.block.dest.extType === ExtensionType.CONFERENCE) {
        result = false;
      }
    }
    return result;
  }
}

export interface SingleBlockData {
  childBlockUuid: string;
  type: BlockType;
  flow: CallFlow;
  parentBlock: Block;
  maxId: number;
  tree: Tree;
  workflowUuid: string;
  version: number;
  skills: SkillCatalog[];
  isDevice: boolean;
  workflow: Workflow;
}
