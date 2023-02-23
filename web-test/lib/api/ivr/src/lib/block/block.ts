import { BlockRef } from './branch/block-ref';
import { Text2Speech } from './text-2-speech';
import { WebhookCommand } from './webhook-block';

export class Block {
  ivrFlowUuid: string;
  version: number;
  uuid: string;
  type: BlockType;
  orgUuid: string;
  label: string;
  tts: Text2Speech = new Text2Speech();
  nextBlocks: BlockRef[] = [];
  nextBlockMap: any = {};
  webHookCommand: WebhookCommand;
  variables: any = {};
  startNumber: string;

  constructor(params?: any) {
    Object.assign(this, params);

    if (params) {
      this.tts = new Text2Speech(params.tts);
      this.nextBlocks = this.nextBlocks.map(block => new BlockRef(block));
    }
  }
}

export enum BlockType {
  play = 'play',
  gather = 'gather',
  transfer = 'transfer',
  notification = 'notification',
  condition = 'condition',
  webhook = 'webhook',
  confirmation = 'confirmation',
  go = 'go',
  monitor = 'monitor',
  genie = 'genie'
}

export class BlockTypeHelper {
  static isMultipleBranchBlock(type: BlockType): boolean {
    return [BlockType.condition, BlockType.gather, BlockType.webhook].includes(type);
  }
}
