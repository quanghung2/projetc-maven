import { MetadataTxnWidget } from '@b3networks/api/auth';
export interface ReqIntelligenceGateway {
  org_uuid: string;
  timezone: string; // member store

  chat_customer_id: string;
  name: string;
  email: string;
  domain: string;
  metadata: MetadataTxnWidget;

  // optional
  queue_uuid: string;
  live_chat_id: string;
  bot: string;
}

export interface ReqIndividualMetting {
  org_uuid: string;
  identity_uuid: string;
  chat_customer_id: string;
  name: string;
  email: string;
  timezone: string;
  language: string;
}

export interface RespIntelligenceGateway {
  convo_id: string;
  handledByBot: boolean;
}
