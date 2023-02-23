import { BlockRef } from './block-ref';

export class WebhookBranch extends BlockRef {
  responseRegex: string;
  order: number;

  constructor(obj?: any) {
    super(obj);
    Object.assign(this, obj);
  }
}
