import { Block, BlockType } from './block';

export class PlayBlock extends Block {
  constructor(params?: any) {
    super(params);
    this.type = BlockType.play;
  }
}
