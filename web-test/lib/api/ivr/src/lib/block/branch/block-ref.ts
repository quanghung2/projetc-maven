export class BlockRef {
  nextBlockUuid: string;
  label: string;
  digit: string;
  startWithList: string[] = [];

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}
