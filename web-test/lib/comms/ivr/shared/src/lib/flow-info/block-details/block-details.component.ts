import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { ProfileOrg } from '@b3networks/api/auth';
import { SkillCatalog } from '@b3networks/api/intelligence';
import {
  Block,
  BlockRef,
  BlockService,
  BlockType,
  CallFlow,
  DestType,
  ExtensionType,
  NodeEntry,
  NotifyBlock,
  TransferBlock,
  Tree,
  Workflow,
  WorkflowStatus,
  WorkflowVersion
} from '@b3networks/api/ivr';
import { ToastService } from '@b3networks/shared/ui/toast';
import * as _ from 'lodash';
import { AppGlobal } from '../../core/service/app-global';
import { ValidCheckService } from '../../core/service/valid-check.service';

declare let $: any;
export enum InvalidText {
  code = 'tts.nothingToConvert',
  message = 'Invalid text'
}

@Component({
  selector: 'b3n-block-details',
  templateUrl: './block-details.component.html',
  styleUrls: ['./block-details.component.scss']
})
export class BlockDetailsComponent implements OnInit, OnChanges {
  readonly WorkflowStatus = WorkflowStatus;
  @Input() tree: Tree;
  @Input() flow: CallFlow;
  @Input() block: Block;
  @Input() parentBlock: Block;
  @Input() sidenav: MatDrawer;
  @Input() workflow: Workflow;
  @Input() workflowVersion: WorkflowVersion;
  @Input() numbersFlowInfo: string[];
  @Input() currentOrg: ProfileOrg;
  @Input() skills: SkillCatalog[];

  @Output() changed = new EventEmitter<BlockDetailsChangedMessage>();
  @Output() swith2EditMode = new EventEmitter<boolean>();

  BlockType = BlockType;

  branch: BlockRef;
  blockTypeMap = this.appGlobal.blockTypeMap;
  saving: boolean;
  editingLabel: boolean;
  newLabel: string;
  isE164numberInvalid: boolean;
  isMultiplePopupOpening: boolean;
  selectedNumbers: string[] = [];
  displayNumbers: string[] = [];
  isDevice: boolean;

  constructor(
    private blockService: BlockService,
    private appGlobal: AppGlobal,
    private validCheckService: ValidCheckService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.validCheckService.isMultiplePopupOpening$.subscribe((isOpening: boolean) => {
      this.isMultiplePopupOpening = isOpening;
    });

    this.validCheckService.isInvalidStransferForm$.subscribe(isInvalid => {
      setTimeout(() => {
        if (this.block && this.block.type === this.BlockType.transfer && !this.isMultiplePopupOpening) {
          this.isE164numberInvalid = isInvalid;
        } else if (this.isMultiplePopupOpening) {
          this.isE164numberInvalid = false;
        }
      }, 100);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.block && this.parentBlock) {
      this.branch = this.parentBlock.nextBlocks.find(next => next.nextBlockUuid === this.block.uuid);

      this.newLabel = this.block.label;
    }

    if (
      this.parentBlock instanceof NotifyBlock &&
      this.parentBlock.webHookCommand &&
      this.parentBlock.webHookCommand.url == null
    ) {
      this.parentBlock.webHookCommand = undefined;
    }
    if (this.block) {
      this.displayNumbers = [];
      this.selectedNumbers = [];
      if (this.block.startNumber) {
        this.selectedNumbers = this.block.startNumber.split(',');
      }
      this.displayNumbers = this.numbersFlowInfo.map(item => item);
    }

    this.isDevice =
      this.workflow && this.workflow.numberList && this.workflow.numberList.find(num => num.isDevice) ? true : false;
  }

  hideSidebar() {
    this.sidenav.toggle();
  }

  save() {
    if (!this.preValidateBeforeSaving()) {
      this.toastService.error(
        'Current call forwarding setting cannot contain any next step. Please delete all blocks behind before saving.'
      );
      return;
    }
    if (this.hasDuplicatedBranch()) {
      return;
    }

    if (
      this.block instanceof TransferBlock &&
      this.block.dest.numbers.length === 0 &&
      this.block.dest.type === DestType.number
    ) {
      this.toastService.error(`Please enter a phone number!`);
      return;
    }

    if (this.block instanceof TransferBlock) {
      this.block.webHookCommand = undefined;
    }

    this.saving = true;
    this.block.startNumber = this.selectedNumbers.toString();
    const version = this.workflowVersion ? this.workflowVersion.version : -1;
    this.blockService.saveBlock(this.flow, this.parentBlock, [this.block], this.workflow.uuid, version).subscribe(
      data => {
        if (data.isSuccess) {
          const tree: Tree = Object.assign(new Tree(), data.tree);
          let parentNode: NodeEntry;
          if (this.parentBlock) {
            parentNode = _.find(tree.nodes, (node: NodeEntry) => {
              return node.uuid === this.parentBlock.uuid;
            });
          }
          const addedNodes: NodeEntry[] = _.filter(tree.nodes, (node: NodeEntry) => {
            return node.uuid === this.block.uuid;
          });

          this.changed.emit(<BlockDetailsChangedMessage>{
            tree: tree,
            flow: data.flow,
            parentNode: parentNode,
            addedNodes: addedNodes
          });
        } else if (data.isOutdatedFlow) {
          this.changed.emit(<BlockDetailsChangedMessage>{
            flow: data.flow,
            outdatedFlowData: true
          });
        } else {
          this.toastService.error('Error happened while saving block.');
        }
        this.saving = false;
        this.toastService.success('Saving completed!');
        this.hideSidebar();
      },
      (err: any) => {
        if (err.error && err.error.errors) {
          this.toastService.error('Validate failure. Please correct the invalid fields.');
        } else if (err.code === InvalidText.code) {
          this.toastService.warning(InvalidText.message);
        } else {
          const errCode =
            err.errors?.[0].code.replace('_', ' ') + '!' || 'Unexpected error happened while saving block.';
          this.toastService.error(errCode);
        }
        this.saving = false;
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

  hasDuplicatedBranch() {
    let duplicate = false;
    if (this.parentBlock && this.parentBlock.type === BlockType.gather) {
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
    if (this.parentBlock && this.parentBlock.type === BlockType.condition) {
      let backupIndex: number;
      const startWithList = this.parentBlock.nextBlocks.map(nextBlock =>
        nextBlock.startWithList.sort((a, b) => a.localeCompare(b)).toString()
      );
      const duplicateStartWith = startWithList.find((startWith, index) => {
        if (startWithList.indexOf(startWith) !== index) {
          backupIndex = index;
          return startWithList.indexOf(startWith) !== index;
        }
        return -1;
      });
      if (duplicateStartWith) {
        const mess = `${this.parentBlock.nextBlocks[backupIndex].startWithList.join(', ')}`;
        this.toastService.warning(`Start with ${mess} has been duplicated.`);
        duplicate = true;
      }
    }
    return duplicate;
  }

  assign(number: string, i: number) {
    const index = this.selectedNumbers.indexOf(number);
    if (index === -1) {
      this.selectedNumbers.push(number);
    }
    this.displayNumbers.splice(i, 1);
  }

  remove(number: string, i: number) {
    this.selectedNumbers.splice(i, 1);
    const index = this.displayNumbers.indexOf(number);
    console.log(index);
    if (index === -1) {
      this.displayNumbers.push(number);
    }
  }

  edit() {
    this.swith2EditMode.emit(true);
  }
}

export interface BlockDetailsChangedMessage {
  flow: CallFlow;
  tree?: Tree;
  parentNode?: NodeEntry;
  addedNodes?: NodeEntry[];
  outdatedFlowData?: boolean;
}
