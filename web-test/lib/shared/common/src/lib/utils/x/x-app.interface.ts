import {
  EventMapListener,
  EventMapName,
  MethodName,
  PostMessageData,
  PostMessageInput,
  UpdateNoticationData
} from './x-app.model';

export interface XModel {
  isStarted: boolean;
  orgUuid: string;
  sessionToken: string;
  listeners: {
    [Property in keyof EventMapListener]?: ListenerX[];
  };
  domain: string;

  init: (env?: string) => void;
  getContext: () => any;

  // Register Listener
  registerListener: (eventName: EventMapName, listener: EventMapListener[EventMapName], onceOnly?: boolean) => string;
  // TODO: Remove, use registerListener()
  addCompanyChangeEventListener: (event: EventMapListener[keyof EventMapListener]) => string;
  addIdentityChangeListener: (event: EventMapListener[keyof EventMapListener]) => string;
  addPaymentChangeEventListener: (event: EventMapListener[keyof EventMapListener]) => string;
  addMemberChangeEventListener: (event: EventMapListener[keyof EventMapListener]) => string;
  addFirebaseMsgEventListener: (event: EventMapListener[keyof EventMapListener]) => string;
  addWebSocketWhatsAppMsgEventListener: (event: EventMapListener[keyof EventMapListener]) => string;
  addInviteNewMemberEventListener: (event: EventMapListener[keyof EventMapListener]) => string;
  addViewPendingInviteEventListener: (event: EventMapListener[keyof EventMapListener]) => string;
  addViewBillingInfoEventListener: (event: EventMapListener[keyof EventMapListener]) => string;
  addMemberSuccessEventListener: (event: EventMapListener[keyof EventMapListener]) => string;
  addCreateCredentialSuccessEventListener: (event: EventMapListener[keyof EventMapListener]) => string;
  getCredentialsInfoEventListener: (event: EventMapListener[keyof EventMapListener]) => string;
  activeApplicationEventListener: (event: EventMapListener[keyof EventMapListener]) => string;

  // Remove listener
  removeEventListener: (eventName: EventMapName) => void;

  // Trigger Event Name
  triggerEventName: (eventName: EventMapName, eventData: EventMapListener[EventMapName]) => void;
  // TODO: Remove, use triggerEventName()
  triggerMemberChangeEvent: () => void;
  triggerInviteNewMemberEvent: () => void;
  triggerViewPendingInviteEvent: () => void;
  triggerViewBillingInfoEvent: () => void;
  triggerAddMemberSuccessEvent: (eventData: any) => void;
  triggerCreateCredentialSuccessEvent: (eventData: any) => void;

  // PostMessage to Portal-base
  fireMessageToParent: <T extends PostMessageData>(method: MethodName, data?: T) => void;
  // TODO: Remove, use fireMessageToParent()
  updateNotificationCount: (data: UpdateNoticationData) => void;
  sendWebSocketMsg: (params: any) => void;
  hideTopup: () => void;
  activateApp: (appId: any) => void;
  showWarn: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  authenticate: () => void;
  showAuth: () => void;
  hideAuth: () => void;
  showAddMemberModal: () => void;
  hideAddMemberModal: () => void;
  showCreateCredentialModal: (memberUuid: string, email: string) => void;
  hideCreateCredentialModal: () => void;
  hideSelectOrgModal: () => void;
  getCredentialsInfo: () => void;

  // private function
  _initContext: (env: any) => void;
  _enableLocal: () => void;
  _putContext: (sessionToken: any, orgUuid: any) => void;
  _getCookieInfo: () => string;
  _getCookie: (cname: any) => any;
  _postMessage: <T extends PostMessageData>(message: PostMessageInput<T>) => void;
  _onMessage: (e: any) => void;
  _handleEvents: (eventName: EventMapName, eventData: EventMapListener[EventMapName]) => void;
  _triggerEvent: (eventName: EventMapName, eventData?: EventMapListener[EventMapName]) => void;
  _addEventListener: (eventName: EventMapName, onEvent: EventMapListener[EventMapName], onceOnly?: boolean) => string;
  _removeEventListener: (eventName: EventMapName, listenerId: any) => void;
  _showMessage: (type: any, title: any, message: any) => void;
}

export interface ListenerX {
  listenerId: string;
  listener: EventMapListener[keyof EventMapListener];
  onceOnly: boolean;
}
