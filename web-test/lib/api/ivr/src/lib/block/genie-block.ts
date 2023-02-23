import { Block, BlockType } from './block';

export class Skill {
  fieldName: string;
  fieldValue: string;

  constructor(obj: Skill) {
    Object.assign(this, obj);
  }
}

export class GenieBlock extends Block {
  skill: string | number;
  data: Skill[] = [];
  path: string;

  constructor(params?: any) {
    super(params);
    this.type = BlockType.genie;
  }
}
