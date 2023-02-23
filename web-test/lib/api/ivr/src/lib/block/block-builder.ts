import { CallFlow } from '../flow/callflow.service';
import { Block, BlockType } from './block';
import { ConditionBlock } from './condition-block';
import { ConfirmBlock } from './confirm-block';
import { GatherBlock } from './gather-block';
import { GoBlock } from './go-block';
import { NotifyBlock } from './notify-block';
import { PlayBlock } from './play-block';
import { TransferBlock } from './transfer-block';
import { WebhookBlock } from './webhook-block';
import { MonitorBlock } from './monitor-block';
import { GenieBlock } from './genie-block';

export class BlockBuilder {
  static createNewBlock(type: BlockType, flow: CallFlow, maxId: number, orgUuid: string) {
    let block = this.createNewInstance(type);
    block.ivrFlowUuid = flow.uuid;
    block.uuid = this.constructBlockUuid(flow, maxId, orgUuid);
    block.orgUuid = orgUuid;
    block.label = `Block ${maxId}`;

    return block;
  }

  static createNewInstance(type: BlockType) {
    switch (type) {
      case BlockType.gather:
        return new GatherBlock();
      case BlockType.transfer:
        return new TransferBlock();
      case BlockType.notification:
        return new NotifyBlock();
      case BlockType.play:
        return new PlayBlock();
      case BlockType.go:
        return new GoBlock();
      case BlockType.condition:
        return new ConditionBlock();
      case BlockType.confirmation:
        return new ConfirmBlock();
      case BlockType.webhook:
        return new WebhookBlock();
      case BlockType.monitor:
        return new MonitorBlock();
      case BlockType.genie:
        return new GenieBlock();
      default:
        return new Block();
    }
  }

  static constructBlockUuid(flow: CallFlow, maxId: number, orgUuid: string) {
    return orgUuid.substring(0, 8).concat('_').concat(flow.uuid.substring(0, 8)).concat('_').concat(String(maxId));
  }
}
