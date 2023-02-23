import { KeyValue } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SkillCatalog } from '@b3networks/api/intelligence';
import {
  Block,
  BlockBuilder,
  BlockRef,
  BlockService,
  BlockType,
  CallFlow,
  ConditionBranch,
  ConditionBranchType,
  DestType,
  NodeEntry,
  TransferBlock,
  Tree
} from '@b3networks/api/ivr';
import { USER_INFO, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { AppGlobal } from '../../../core/service/app-global';
import { ValidCheckService } from '../../../core/service/valid-check.service';
import { InvalidText } from '../../block-details/block-details.component';
import { UpdateBlockInput } from '../../flow-info.component';
import { SingleBlockData, SingleBlockDialogComponent } from '../single/single.component';

const MAXIMUM_ALLOWED_BLOCKS = 100;

@Component({
  selector: 'b3n-multiple',
  templateUrl: './multiple.component.html',
  styleUrls: ['./multiple.component.scss']
})
export class MultipleBlocksDialogComponent implements OnInit, OnDestroy {
  readonly messageMapping = {
    [BlockType.gather]: `Exceeded the maximum number of Options that can be created in one Gather Input block (100)`,
    [BlockType.condition]: `Exceeded the maximum number of Conditions that can be created in one Conditions block (100)`
  };
  blockOptions: KeyValue<BlockType, string>[] = [
    { key: BlockType.gather, value: 'Gather input' },
    { key: BlockType.transfer, value: 'Transfer call' },
    { key: BlockType.notification, value: 'Record call and notify' },
    { key: BlockType.play, value: 'Play message only' },
    { key: BlockType.go, value: 'Forward to' },
    { key: BlockType.condition, value: 'Set Condition' },
    { key: BlockType.confirmation, value: 'Confirm' },
    { key: BlockType.webhook, value: 'Webhook' },
    { key: BlockType.genie, value: 'Genie' }
    // { key: BlockType.monitor, value: 'Monitor call' },
  ];

  blockType: string;
  flow: CallFlow;
  parentBlock: Block;
  maxId: number;

  selectedBranch: BlockRef;

  blockItems: BlockItem[] = [];
  selectedBlockItem: BlockItem;
  tree: Tree;

  blockTypeMap = this.appGlobal.blockTypeMap;

  blockIdsHolder: KeyValue<string, BlockIdState>[] = [];

  saving: boolean;
  triggerReloadBranchLabel = false;

  BlockType = BlockType;

  isE164numberInvalid = false;
  isStartWithInvalid = false;
  private currentErrors: any[] = [];
  invalid: boolean;
  skills: SkillCatalog[];
  isDevice: boolean;

  constructor(
    public dialogRef: MatDialogRef<SingleBlockDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SingleBlockData,
    private blockService: BlockService,
    private appGlobal: AppGlobal,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private validCheckService: ValidCheckService
  ) {}

  ngOnInit() {
    this.isDevice = this.data.isDevice;
    this.validCheckService.isMultiplePopupOpening(true);
    this.blockType = this.data.type;
    this.skills = this.data.skills;

    this.flow = this.data.flow;
    this.parentBlock = this.data.parentBlock;
    this.maxId = this.data.maxId;
    this.addMoreBlock();
    this.tree = this.data.tree;

    if (this.blockType === BlockType.condition) {
      this.isStartWithInvalid = true;
      this.validCheckService.isInvalidConditionBlock$.subscribe(isInvalid => {
        setTimeout(() => {
          this.isStartWithInvalid = isInvalid;
        }, 100);
      });
    }
    if (
      this.blockType === BlockType.gather ||
      this.blockType === BlockType.condition ||
      this.blockType === BlockType.webhook
    ) {
      this.isE164numberInvalid = true;
      this.validCheckService.isInvalidStransferForm$.subscribe(isInvalid => {
        setTimeout(() => {
          this.isE164numberInvalid = isInvalid;
        }, 100);
      });
    }
  }

  ngOnDestroy(): void {
    this.validCheckService.setInvalidTransferForm(false);
    this.validCheckService.checkInvalidConditionBlock([]);
    this.validCheckService.isMultiplePopupOpening(false);
  }

  addMoreBlock() {
    if (this.blockItems?.length >= MAXIMUM_ALLOWED_BLOCKS) {
      this.toastService.warning(this.messageMapping[this.blockType] || 'Exceeded the allowed number of blocks.');
      return;
    }
    const newBlockId: number = this.getAvailableBlockId();

    this.toggleBlockIdStatus(newBlockId);

    this.selectedBlockItem = new BlockItem(
      BlockBuilder.createNewBlock(BlockType.transfer, this.flow, newBlockId, X.getContext()[USER_INFO.orgUuid])
    );

    this.selectedBranch = this.blockService.addBranch(this.selectedBlockItem.block.uuid, this.parentBlock);

    this.blockItems.push(this.selectedBlockItem);
  }

  selectBranch(blockItem: BlockItem) {
    this.selectedBlockItem = blockItem;

    this.selectedBranch = this.blockService.getBranch(blockItem.block.uuid, this.parentBlock);
  }

  deleteBlock(blockUuid: string) {
    if (this.blockItems.length === 1) {
      console.log('must has at least one block');
      return;
    }

    this.blockItems = this.blockItems.filter(item => item.block.uuid !== blockUuid);

    this.blockService.removeBranch(blockUuid, this.parentBlock);

    const deletedBlockId: number = this.parseBlockId(blockUuid);

    this.toggleBlockIdStatus(deletedBlockId);
  }

  private parseBlockId(blockUuid: string): number {
    const startIndex = blockUuid.lastIndexOf('_') + 1;
    return Number(blockUuid.substring(startIndex));
  }

  changeBlockType(type: BlockType) {
    this.blockItems.forEach(blockItem => {
      if (blockItem.block.uuid === this.selectedBlockItem.block.uuid) {
        const blockId = Number(blockItem.block.uuid.substring(blockItem.block.uuid.lastIndexOf('_') + 1));

        blockItem.block = BlockBuilder.createNewBlock(type, this.flow, blockId, X.getContext()[USER_INFO.orgUuid]);
        this.selectedBlockItem.block = blockItem.block;
      }
    });
  }

  triggerReloadBranchLabelEvent() {
    this.triggerReloadBranchLabel = !this.triggerReloadBranchLabel;
    this.blockService.updateNextBlockMap(this.parentBlock);
    if (
      this.selectedBranch instanceof ConditionBranch &&
      this.selectedBranch.type === ConditionBranchType.callerIdPattern &&
      this.selectedBranch.startWithList.length === 0
    ) {
      this.isStartWithInvalid = true;
    } else {
      this.isStartWithInvalid = false;
    }
    this.cdr.detectChanges();
  }

  private toggleBlockIdStatus(blockId: number) {
    let existed = false;
    this.blockIdsHolder.forEach(item => {
      if (item.key === String(blockId)) {
        if (item.value === BlockIdState.reserved) {
          item.value = BlockIdState.available;
          existed = true;
        } else if (item.value === BlockIdState.available) {
          item.value = BlockIdState.reserved;
          existed = true;
        }
      }
    });

    if (!existed) {
      this.blockIdsHolder.push({
        key: String(blockId),
        value: BlockIdState.reserved
      });
    }
  }

  private getAvailableBlockId(): number {
    if (this.blockIdsHolder.length > 0) {
      const availableItem = this.blockIdsHolder.find(item => item.value === BlockIdState.available);
      if (availableItem) {
        return Number(availableItem.key);
      }
    }
    return this.maxId + 1 + this.blockItems.length;
  }

  save() {
    if (this.saving) {
      return;
    }
    if (this.hasDuplicatedBranch()) {
      return;
    }
    if (
      this.selectedBlockItem.block instanceof TransferBlock &&
      this.selectedBlockItem.block.dest.numbers.length === 0 &&
      this.selectedBlockItem.block.dest.type === DestType.number
    ) {
      this.toastService.warning(`Please enter a phone number!`);
      return;
    }
    this.saving = true;
    this.currentErrors = [];
    const currents: Block[] = this.blockItems.map(item => item.block);

    this.blockService
      .saveBlock(this.flow, this.parentBlock, currents, this.data.workflowUuid, this.data.version)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        data => {
          //TODO refactor this code
          if (data.isSuccess) {
            const tree: Tree = Object.assign(new Tree(), data.tree);
            const parentNode: NodeEntry = tree.nodes.find(node => node.uuid === this.parentBlock.uuid);
            const addedNodes: NodeEntry[] = tree.nodes.filter(node => !currents.find(item => item.uuid === node.uuid));

            this.dialogRef.close(<UpdateBlockInput>{
              tree: tree,
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
            this.dialogRef.close();
          }
        },
        (err: any) => {
          if (err.error && err.error.errors) {
            this.currentErrors = err.error.errors;
            this.navigateToErrorBranch();
            this.toastService.error('Validate failure. Please correct the invalid fields.');
          } else if (err && err.errors && err.errors?.[0] && err.errors?.[0].code) {
            const errorCode = err.errors?.[0].code.replace('_', ' ');
            const message = errorCode.charAt(0).toUpperCase() + errorCode.slice(1).toLowerCase();
            this.toastService.error(message);
          } else if (err.code === InvalidText.code) {
            this.toastService.warning(InvalidText.message);
          } else {
            this.toastService.error('Unexpected error happened while saving block.');
          }

          console.error(err);
          this.saving = false;
        }
      );
  }

  hasDuplicatedBranch() {
    let duplicate = false;
    if (this.parentBlock.type === BlockType.gather) {
      const digits = this.parentBlock.nextBlocks.map(block => {
        if (block && block.digit) {
          return block.digit.toString();
        }
        return '';
      });
      const duplicateDigit = digits.find((digit, index) => digits.indexOf(digit) !== index);
      if (duplicateDigit) {
        duplicate = true;
        const message = duplicateDigit.includes(`any`)
          ? `Any digit has been duplicated.`
          : duplicateDigit.includes(`none`)
          ? `No digit has been duplicated.`
          : `Digit ${duplicateDigit} has been duplicated.`;
        this.toastService.warning(message);
      }
    }
    if (this.parentBlock.type === BlockType.condition) {
      const startWithList = this.parentBlock.nextBlocks
        .map(nextBlock => nextBlock.startWithList.sort((a, b) => a.localeCompare(b)).toString())
        .filter(Boolean);
      const duplicateIndex = startWithList.findIndex((startWith, index) => startWithList.indexOf(startWith) !== index);
      if (duplicateIndex >= 0) {
        const mess = `${this.parentBlock.nextBlocks[duplicateIndex].startWithList.join(', ')}`;
        this.toastService.warning(`Start with ${mess} has been duplicated.`);
        duplicate = true;
      }
    }
    return duplicate;
  }

  private navigateToErrorBranch() {
    const errorBlockList: string[] = this.currentErrors.map(error => {
      const regex = /\[[^\]]+\]/g;
      const matches: string[] = error.field.match(regex);
      if (matches.length === 2) {
        return matches[1].replace('[', '').replace(']', '');
      } else if (matches.length === 1) {
        return matches[0].replace('[', '').replace(']', '');
      }
      return '';
    });

    if (errorBlockList.length > 0) {
      const blockItem: BlockItem = this.blockItems.find(item => item.block.uuid === errorBlockList[0]);

      if (blockItem) {
        this.selectBranch(blockItem);
      } else {
        this.selectBranch(this.selectedBlockItem);
      }
    }
  }
}

export class BlockItem {
  constructor(public block: Block) {}
}

export enum BlockIdState {
  available,
  reserved
}
