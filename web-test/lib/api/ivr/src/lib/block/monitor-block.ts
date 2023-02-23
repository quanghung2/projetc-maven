import { Block, BlockType } from './block';

export class MonitorBlock extends Block {
  constructor(params?: any) {
    super(params);
    this.type = BlockType.monitor;
  }
}
