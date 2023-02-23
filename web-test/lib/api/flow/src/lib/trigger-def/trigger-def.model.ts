import { BodyParameter, Output } from '../common.model';
import { Connector } from '../connector/connector.model';
import { ExtensionConfig } from '../flow/trigger/trigger.model';

export class TriggerDef {
  baUseKeyComponents: string[];
  bodyParameters: BodyParameter[];
  connector: Connector;
  description: string;
  extensionConfig: ExtensionConfig;
  headersParameters: BodyParameter[];
  iconUrl: string;
  name: string;
  outputs: Output[];
  urlParameters: BodyParameter[];
  uuid: string;
  originalUuid: string;

  // support UI
  displayName: string;

  constructor(obj?: Partial<TriggerDef>) {
    if (obj) {
      Object.assign(this, obj);
      this.displayName = this.name;
      if (this.connector?.name) {
        this.displayName = `${this.name} - ${this.connector.name}`;
      }
    }
  }
}
