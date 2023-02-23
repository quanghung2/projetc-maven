import { Block, BlockType } from './block';

export class ConfirmBlock extends Block {
  constructor(params?: any) {
    super(params);

    this.type = BlockType.confirmation;
  }
}
