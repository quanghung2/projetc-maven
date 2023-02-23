import { ID } from '@datorama/akita';
export enum EnumTypeAction {
  FIRE_THEN_FORGET = 'FIRE_THEN_FORGET'
}

export class ParamConfig {
  key: string;
  name: string = '';
  value: string = '';
  description: string;
  isRequired: boolean;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class SkillCatalog {
  code: ID;
  description: string;
  group: string;
  groupName: string;
  name: string;
  path: string;
  type: EnumTypeAction;
  params: ParamConfig[];
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      this.params = this.params ? this.params.map(x => new ParamConfig(x)) : [];
    }
  }
}

export interface FillterSkillCatalog {
  type: EnumTypeAction;
}
