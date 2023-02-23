export class AutoResponse {
  event: string;
  templateMessageId: string;
  cannedResponseId: number;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class AutoResponseRequest {
  event: string;
  cannedResponseId: number;
  templateMessageId: string;
}
