import { RequestCreateMedia } from '../media/media.model';

export class WhatsAppTemplate {
  name: string;
}

export class WhatsAppMessage {
  text: string;
  mediaUuid: string;
  mediaCaption: string;
  template: WhatsAppTemplate;
  media?: RequestCreateMedia;
}

export class SendWhatsAppRequest {
  convoUuid: string;
  clientTs: number;
  message: WhatsAppMessage;
}
