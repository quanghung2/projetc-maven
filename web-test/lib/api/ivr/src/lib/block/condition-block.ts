import { Block, BlockType } from './block';
import { ConditionBranch } from './branch/condition-branch';

export class ConditionBlock extends Block {
  constructor(params?: any) {
    super(params);

    this.nextBlocks = this.nextBlocks.map(b => new ConditionBranch(b));

    this.type = BlockType.condition;
  }
}
