import { KeyValue } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Block, BlockType } from '@b3networks/api/ivr';

@Component({
  selector: 'b3n-previous',
  templateUrl: './previous.component.html',
  styleUrls: ['./previous.component.scss']
})
export class PreviousComponent implements OnInit {
  options: KeyValue<BlockType, string>[] = [
    { key: BlockType.transfer, value: 'Transfer call' },
    { key: BlockType.notification, value: 'Record call and notify' },
    { key: BlockType.play, value: 'Play message only' },
    { key: BlockType.go, value: 'Forward to' },
    { key: BlockType.confirmation, value: 'Confirm' }
    // { key: BlockType.monitor, value: 'Monitor call' }
  ];

  BlockType = BlockType;

  block: Block;
  addFirstBlock: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<PreviousComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PreviousDataReq
  ) {}

  ngOnInit() {
    this.addFirstBlock = !this.data.parentBlock;
  }

  selectType(option: KeyValue<BlockType, string>) {
    this.dialogRef.close(<PreviousResp>{ blockType: option.key });
  }
}

export interface PreviousDataReq {
  block: Block;
  parentBlock: Block;
}

export interface PreviousResp {
  blockType: BlockType;
}
