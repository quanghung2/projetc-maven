import { BlockRef } from './block-ref';

export interface UploadEvent {
  status: string;
  percentage: number;
}

export class GatherBranch extends BlockRef {
  s3Key: string;
  maxDigit = 1;

  uploadEvent: UploadEvent;
  uploadIndicator = false;
  type: GatherBranchType;

  constructor(obj?: any) {
    super(obj);
    if (obj.type !== `multiple`) {
      obj.s3Key = null;
    }
    Object.assign(this, obj);
    this.type = this.getType();
  }

  getType(): GatherBranchType {
    if (!this.type) {
      return GatherBranchType.one;
    }
    if (this.s3Key) {
      return GatherBranchType.multiple;
    }

    if (this.digit == GatherBranchType[GatherBranchType.none]) {
      return GatherBranchType.none;
    } else if (this.digit == GatherBranchType[GatherBranchType.any]) {
      return GatherBranchType.any;
    } else if (!this.digit) {
      return GatherBranchType.regex;
    } else {
      return GatherBranchType.one;
    }
  }
}

export enum GatherBranchType {
  multiple = 'multiple',
  none = 'none',
  any = 'any',
  one = 'one',
  regex = 'regex'
}
