import { Block, BlockType } from './block';
import { BlockRef } from './branch/block-ref';

export class NodeEntry {
  uuid: string;
  label: string;
  type: BlockType;
  level: number;
  refs: BlockRef[] = [];
  message: string;
  startNumber: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }

  updateFrom(block: Block): NodeEntry {
    this.uuid = block.uuid;
    this.label = block.label;
    this.type = block.type;
    this.refs = block.nextBlocks;

    return this;
  }
}
