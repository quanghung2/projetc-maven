import { MsgType } from '@b3networks/api/workspace';

export const RIGHT_SIDEBAR_ID = 'app-right-sidebar-content';

export const UNKNOWN_USER = 'Unknown user';
export const APPROVAL_BOT_NAME = 'Approval Bot';

export const RECEIVE_MSG_TYPE_UNIFIED_WORKSPACE: MsgType[] = [
  MsgType.attachment,
  MsgType.system,
  MsgType.message,
  MsgType.mcq,
  MsgType.prechatsurvey,
  MsgType.whatsAppWelcome,
  MsgType.webhook,
  MsgType.email,
  MsgType.online,
  MsgType.offline,
  MsgType.callMsg,
  MsgType.imess,
  MsgType.case,
  MsgType.transfer,
  MsgType.summary
];

export const CONST_UW = {
  appId: '1pxjX3FQumSFHzjC',
  wallboardAppId: 'Y4v35i2TXBM0XL2l',
  ORG_B3_NETWORKS: 'fc312420-0047-49a7-94a8-003f11f115c0',
  ORG_EXP: '9b311930-2c04-4e49-9c8f-b745807dc64c',
  isdnProduct: {
    id: 'p3d0r3gcO6ROYzxr',
    mobileDncCode: 'mobile_dnc',
    mobileDpoCode: 'mobile_dpo',
    mobileCrCode: 'mobile_call_recording'
  }
};

export enum ChatType {
  channel = 'channel',
  email = 'email',
  whatsapp = 'whatsapp',
  livechat = 'livechat',
  sms = 'sms'
}
