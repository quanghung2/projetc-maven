import { Block, BlockType } from './block';

export class TransferBlock extends Block {
  ringTime: number = 30;
  dest: Destination = new Destination();
  callerIdStrategy: CallerIdStrategy = new CallerIdStrategy();

  constructor(params?: any) {
    super(params);

    if (params) {
      this.ringTime = params.ringTime;
      this.dest = new Destination(params.dest);
      this.callerIdStrategy = new CallerIdStrategy(params.callerIdStrategy);
    }

    this.type = BlockType.transfer;
  }

  get isTransferBlockWithForwardCall(): boolean {
    return this.dest && this.dest.type != DestType[DestType.number];
  }
}
export enum ExtensionType {
  EXTENSION = 'EXTENSION',
  EXTENSION_GROUP = 'EXTENSION_GROUP',
  CONFERENCE = 'CONFERENCE'
}

export class Destination {
  type = DestType.number;
  numbers: string[] = [];
  orgUuid: string;
  queueUuid: string;
  // extensionKeys: string[] = [];
  ext: string;
  extType: ExtensionType;
  groupUuid: string;
  ivrFlowUuid: string;
  forwardByKeys: boolean = false;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

export class CallerIdStrategy {
  type: CallerIdStrategyType;
  prefixCallerId: string;

  constructor(obj?: any) {
    Object.assign(this, obj);

    if (!this.type) {
      this.type = CallerIdStrategyType.displayCaller;
    }
  }
}

export enum DestType {
  number = 'e164number',
  callcenter = 'callcenter',
  bizphone = 'bizphone',
  booking = 'booking',
  forwardBack2MSISDN = 'forwardBack2MSISDN'
}

export enum CallerIdStrategyType {
  displayCaller = 'displayCaller',
  displayB3Number = 'displayB3Number'
}
