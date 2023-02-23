import { Block, BlockType } from './block';
import { BlockRef } from './branch/block-ref';

export class GoBlock extends Block {
  goTimes: number = 3;
  goBlock: BlockRef;

  constructor(params?: any) {
    super(params);
    if (params) {
      this.goTimes = params.goTimes;
      this.goBlock = new BlockRef(params.goBlock);
    }
    this.type = BlockType.go;
  }
}
