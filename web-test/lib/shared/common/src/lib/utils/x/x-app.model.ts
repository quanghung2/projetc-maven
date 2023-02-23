import { ChatMessage, ChatSession, ChatTopic, MsgType, SocketStatus } from '@b3networks/api/workspace';

export enum MethodName {
  AddEventListener = 'AddEventListener',
  TriggerEvent = 'TriggerEvent',
  CallbackEventData = 'CallbackEventData',
  ShowMessage = 'ShowMessage',
  UpdateNotificationCount = 'UpdateNotificationCount',
  SendWebSocketMsg = 'SendWebSocketMsg',
  HideTopup = 'HideTopup',
  ActivateApp = 'ActivateApp',
  ShowAuth = 'ShowAuth',
  HideAuth = 'HideAuth',
  ShowAddMemberModal = 'ShowAddMemberModal',
  HideAddMemberModal = 'HideAddMemberModal',
  ShowCreateCredentialModal = 'ShowCreateCredentialModal',
  HideCreateCredentialModal = 'HideCreateCredentialModal',
  HideSelectOrgModal = 'HideSelectOrgModal',

  // websocket
  RegisterWebsocket = 'RegisterWebsocket',
  SendMessage = 'SendMessage',
  GetCredentialsInfo = 'GetCredentialsInfo',
  ChangedNavigateRouter = 'ChangedNavigateRouter',
  UpdateTitle = 'UpdateTitle'
}

export enum EventMapName {
  company = 'company',
  identityChange = 'identityChange',
  payment = 'payment',
  member = 'member',
  firebaseMsg = 'firebaseMsg',
  webSocketWhatsAppMsg = 'webSocketWhatsAppMsg',
  updateDarkMode = 'updateDarkMode',
  inviteNewMember = 'inviteNewMember',
  activeApplication = 'activeApplication',
  viewPendingInvite = 'viewPendingInvite',
  viewBillingInfo = 'viewBillingInfo',
  addMemberSuccess = 'addMemberSuccess',
  createCredentialSuccess = 'createCredentialSuccess',

  // websocket
  socketStatus = 'socketStatus',
  onMessage = 'onMessage',
  onSession = 'onSession',
  getCredentialsInfo = 'getCredentialsInfo',
  changedNavigateRouter = 'changedNavigateRouter'
}

export interface EventMapListener {
  company: onCompanyChangeEvent;
  identityChange: onIdentityChangeEvent;
  payment: onPaymentChangeEvent;
  member: onMemberChangeEvent;
  firebaseMsg: onFirebaseMsgEvent;
  webSocketWhatsAppMsg: onWebSocketWhatsAppMsgEvent;
  updateDarkMode: onUpdateDarkModeEvent;
  inviteNewMember: onInviteNewMemberEvent;
  activeApplication: onActiveApplicationEventListener;
  viewPendingInvite: onViewPendingInviteEvent;
  viewBillingInfo: onViewBillingInfoEvent;
  addMemberSuccess: onAddMemberSuccessEvent;
  createCredentialSuccess: createCredentialSuccessEvent;

  // websocket
  socketStatus: onSocketStatusListener;
  onMessage: onMessageListener;
  onSession: onSessionListener;
  getCredentialsInfo: onGetCredentialsInfoListener;
  changedNavigateRouter: onChangedNavigateRouter;
}

// use fire msg to iframes which registed listener
export interface EventMapFireData {
  company: any;
  identityChange: any;
  payment: any;
  member: any;
  firebaseMsg: any;
  webSocketWhatsAppMsg: string;
  updateDarkMode: boolean;
  inviteNewMember: any;
  activeApplication: ActiveApplicationInput;
  viewPendingInvite: any;
  viewBillingInfo: any;
  addMemberSuccess: any;
  createCredentialSuccess: any;

  // websocket
  socketStatus: SocketStatus;
  onMessage: ChatMessage;
  onSession: ChatSession;
  getCredentialsInfo: { orgUuid: string };
  changedNavigateRouter: { path: string };
}

export type onCompanyChangeEvent = (event: any) => void;
export type onIdentityChangeEvent = (event: any) => void;
export type onPaymentChangeEvent = (event: any) => void;
export type onMemberChangeEvent = (event: any) => void;
export type onFirebaseMsgEvent = (event: any) => void;
export type onWebSocketWhatsAppMsgEvent = (event: string) => void;
export type onUpdateDarkModeEvent = (event: boolean) => void;
export type onInviteNewMemberEvent = (event: any) => void;
export type onActiveApplicationEventListener = (event: ActiveApplicationInput) => void;
export type onViewPendingInviteEvent = (event: any) => void;
export type onViewBillingInfoEvent = (event: any) => void;
export type onAddMemberSuccessEvent = (event: any) => void;
export type createCredentialSuccessEvent = (event: any) => void;
export type onSocketStatusListener = (status: SocketStatus) => void;
export type onMessageListener = (message: ChatMessage) => void;
export type onSessionListener = (session: ChatSession) => void;
export type onGetCredentialsInfoListener = (event: any) => void;
export type onChangedNavigateRouter = (path: string) => void;

export interface ActiveApplicationInput {
  appId: string;
}

export interface PostMessageData {
  orgUuid: string;
}

export interface PostMessageInput<T extends PostMessageData> {
  method: MethodName;
  data?: T;
}

export interface TriggerEventData extends PostMessageData {
  eventName: EventMapName;
  eventData?: any;
}

export interface CallbackEventData extends PostMessageData {
  eventName: EventMapName;
}

export interface SendMessageEventData extends PostMessageData {
  message: string; // ChatMessage
}

export interface ActivateAppData extends PostMessageData {
  appId: string;
}

export interface UpdateNoticationData extends PostMessageData {
  notification: number;
}

export interface ChangedNavigateRouterData extends PostMessageData {
  path: string;
}

export interface UpdateTitleData extends PostMessageData {
  title: string;
}

export interface CreateCredentialModal extends PostMessageData {
  memberUuid: string;
  email: string;
}

export interface RegisterWebSocket extends PostMessageData {
  mt: MsgType[];
  topics: ChatTopic[];
}
