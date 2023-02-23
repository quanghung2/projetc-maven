import { Component, ElementRef, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Block, BlockType, CallFlow, Tree } from '@b3networks/api/ivr';
import { KeyValue } from '@angular/common';

@Component({
  selector: 'b3n-next',
  templateUrl: './next.component.html',
  styleUrls: ['./next.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class NextDialogComponent implements OnInit {
  basicOptions: KeyValue<BlockType, string>[] = [
    { key: BlockType.gather, value: 'Gather input' },
    { key: BlockType.transfer, value: 'Transfer call' },
    { key: BlockType.notification, value: 'Record call and notify' },
    { key: BlockType.play, value: 'Play message only' }
    // {key: BlockType.monitor, value: 'Monitor call'}
  ];
  advanceOptions: KeyValue<BlockType, string>[] = [
    { key: BlockType.go, value: 'Forward to' },
    { key: BlockType.condition, value: 'Set Condition' },
    { key: BlockType.confirmation, value: 'Confirm' },
    { key: BlockType.webhook, value: 'Webhook' },
    { key: BlockType.genie, value: 'Genie' }
  ];

  BlockType = BlockType;

  showBasicMode: boolean;
  isIncomingBlock: boolean;
  block: Block;
  ownerId: string;
  flow: CallFlow;
  tree: Tree;

  constructor(
    public dialogRef: MatDialogRef<NextDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NextDialogData
  ) {}

  ngOnInit() {
    this.ownerId = this.data.ownerId;
    this.tree = this.data.tree;
    this.flow = this.data.flow;
    this.block = this.data.block;
    this.showBasicMode = true;
    this.isIncomingBlock = this.data.ownerId === 'incoming-block';
  }

  selectType(option: KeyValue<BlockType, string>) {
    this.dialogRef.close(<NextDialogResp>{ nextType: 'single', blockType: option.key });
  }

  createMultipleBlocks() {
    this.dialogRef.close(<NextDialogResp>{ nextType: 'multiple' });
  }
}

export interface NextDialogData {
  tree: Tree;
  flow: CallFlow;
  block: Block;
  ownerId: string;
  trigger: ElementRef;
}

export interface NextDialogResp {
  blockType?: BlockType;

  nextType: 'single' | 'multiple';
}
