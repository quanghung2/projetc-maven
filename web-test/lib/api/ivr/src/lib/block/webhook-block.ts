import { Block, BlockType } from './block';
import { WebhookBranch } from './branch/webhook-branch';

export class WebhookBlock extends Block {
  override webHookCommand: WebhookCommand = new WebhookCommand();

  constructor(params?: any) {
    super(params);

    if (params) {
      this.nextBlocks = params.nextBlocks.map(b => new WebhookBranch(b));
      this.webHookCommand = new WebhookCommand(params.webHookCommand);
    }

    this.type = BlockType.webhook;
  }
}

export class WebhookCommand {
  url: string;
  method = 'get';
  headers: any = {
    'Content-Type': 'application/json'
  };
  parameters: any = {};
  contextParameters: ContextParameter[] = [];

  constructor(params?: any) {
    Object.assign(this, params);
  }
}

export class ContextParameter {
  constructor(public context?: string, public asKey?: string, public script?: string) {}
}
