import { Block, BlockType } from './block';
import { GatherBranch } from './branch/gather-branch';

export class GatherBlock extends Block {
  attempts: number = 3;
  timeout: number = 5;
  maxDigits: number = 1;

  constructor(params?: any) {
    super(params);
    if (params) {
      this.attempts = params.attempts;
      this.timeout = params.timeout;
      this.maxDigits = params.maxDigits;
      this.nextBlocks = params.nextBlocks.map(b => new GatherBranch(b));
    }
    this.type = BlockType.gather;
  }
}
