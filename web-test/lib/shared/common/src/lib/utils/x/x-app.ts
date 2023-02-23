import { ListenerX, XModel } from './x-app.interface';
import {
  ActivateAppData,
  CreateCredentialModal,
  EventMapListener,
  EventMapName,
  MethodName,
  PostMessageData,
  PostMessageInput,
  TriggerEventData,
  UpdateNoticationData
} from './x-app.model';

const ORG_UUID = 'orgUuid';
const SESSION_TOKEN = 'sessionToken';
/*
 * X Javascript API v1.0.0
 *
 */

const X: XModel = {
  isStarted: false,
  orgUuid: '',
  sessionToken: '',
  listeners: {},
  domain: '',

  /*
   * Initializes the event listeners if it was not already started
   * env is in ["local", "uat", "prod"]
   */

  init: function (env?: string) {
    if (!this.isStarted) {
      this.isStarted = true;
      const _tmp = event => {
        this._onMessage(event);
      };
      if (window.addEventListener) {
        window.addEventListener('message', _tmp, false);
      } else {
        window['onmessage'] = _tmp;
      }
      this._initContext(env);
    }
  },

  /* Get context {orgUuid, sessionToken} */
  getContext: function () {
    const params: { [key: string]: string | number } = {};
    params[ORG_UUID] = this.orgUuid;
    params[SESSION_TOKEN] = this.sessionToken;
    return params;
  },

  /*
   * Adds a Company Change Event listener which is triggered when some company information has changed.
   *
   * onCompanyChangeEvent: A function to be called when the company change event occurs. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addCompanyChangeEventListener: function (onCompanyChangeEvent) {
    return this._addEventListener(EventMapName.company, onCompanyChangeEvent);
  },

  /*
   * Adds a IdentityChange listener which is triggered when there is any IdentityChange event is pushed to portal.
   *
   * onIdentityChangeEvent: A function to be called when there is any IdentityChange event is pushed to portal. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addIdentityChangeListener: function (onIdentityChangeEvent) {
    return this._addEventListener(EventMapName.identityChange, onIdentityChangeEvent);
  },

  /*
   * Adds a Payment Change Event listener which is triggered when some payment information or billing details has been changed.
   *
   * onPaymentChangeEvent: A function to be called when the payment event occurs. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addPaymentChangeEventListener: function (onPaymentChangeEvent) {
    return this._addEventListener(EventMapName.payment, onPaymentChangeEvent);
  },

  /*
   * Adds a Member Change Event listener which is triggered when some member information has been changed.
   *
   * onMemberChangeEvent: A function to be called when the member event occurs. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addMemberChangeEventListener: function (onMemberChangeEvent) {
    return this._addEventListener(EventMapName.member, onMemberChangeEvent);
  },

  /**
   * Trigger invite new member event
   */
  triggerMemberChangeEvent: function () {
    this._triggerEvent(EventMapName.member);
  },

  /*
   * Adds a Firebase Msg Event listener which is triggered when there is any msg is pushed to portal.
   *
   * onFirebaseMsgEvent: A function to be called when there is any msg is pushed to portal. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addFirebaseMsgEventListener: function (onFirebaseMsgEvent) {
    return this._addEventListener(EventMapName.firebaseMsg, onFirebaseMsgEvent);
  },

  /*
   * Adds a WebSocket WhatsApp Msg Event listener which is triggered when there is any msg is pushed to portal.
   *
   * onWebSocketWhatsAppMsgEvent: A function to be called when there is any msg is pushed to portal. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addWebSocketWhatsAppMsgEventListener: function (onWebSocketWhatsAppMsgEvent) {
    return this._addEventListener(EventMapName.webSocketWhatsAppMsg, onWebSocketWhatsAppMsgEvent);
  },

  /*
   * Adds a inviteNewMember event listener which is triggered when there is any inviteNewMember event is pushed to portal.
   *
   * onInviteNewMemberEvent: A function to be called when there is any inviteNewMember event is pushed to portal. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addInviteNewMemberEventListener: function (onInviteNewMemberEvent) {
    return this._addEventListener(EventMapName.inviteNewMember, onInviteNewMemberEvent);
  },

  /*
   * Active application event listener which is triggered when there is any msg event is pushed to portal.
   *
   * onActiveApplicationEventListener: A function to be called when there is any activeApplication event is pushed to portal. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  activeApplicationEventListener: function (onActiveApplicationEventListener) {
    return this._addEventListener(EventMapName.activeApplication, onActiveApplicationEventListener);
  },

  /**
   * Trigger invite new member event
   */
  triggerInviteNewMemberEvent: function () {
    this._triggerEvent(EventMapName.inviteNewMember);
  },

  /*
   * Adds a View Pending Invite listener which is triggered when there is any viewPendingInvite event is pushed to portal.
   *
   * onViewPendingInviteEvent: A function to be called when there is any viewPendingInvite event is pushed to portal. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addViewPendingInviteEventListener: function (onViewPendingInviteEvent) {
    return this._addEventListener(EventMapName.viewPendingInvite, onViewPendingInviteEvent);
  },

  /**
   * Trigger view pending invite event
   */
  triggerViewPendingInviteEvent: function () {
    this._triggerEvent(EventMapName.viewPendingInvite);
  },

  /*
   * Adds a View Billing Info listener which is triggered when there is any viewBillingInfo event is pushed to portal.
   *
   * onViewBillingInfoEvent: A function to be called when there is any viewBillingInfo event is pushed to portal. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addViewBillingInfoEventListener: function (onViewBillingInfoEvent) {
    return this._addEventListener(EventMapName.viewBillingInfo, onViewBillingInfoEvent);
  },

  /**
   * Trigger view billing info event
   */
  triggerViewBillingInfoEvent: function () {
    this._triggerEvent(EventMapName.viewBillingInfo);
  },

  /*
   * Adds a add member success listener which is triggered when member is added successfully.
   *
   * onAddMemberSuccessEvent: A function to be called when member is added successfully.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addMemberSuccessEventListener: function (onAddMemberSuccessEvent) {
    return this._addEventListener(EventMapName.addMemberSuccess, onAddMemberSuccessEvent);
  },

  /**
   * Trigger add member success event
   */
  triggerAddMemberSuccessEvent: function (eventData) {
    this._triggerEvent(EventMapName.addMemberSuccess, eventData);
  },

  /*
   * create credential success listener which is triggered when create credential successfully.
   *
   * createCredentialSuccessEvent: A function to be called when member is added successfully.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addCreateCredentialSuccessEventListener: function (createCredentialSuccessEvent) {
    return this._addEventListener(EventMapName.createCredentialSuccess, createCredentialSuccessEvent);
  },

  /**
   * Trigger add create credential success event
   */
  triggerCreateCredentialSuccessEvent: function (eventData) {
    this._triggerEvent(EventMapName.createCredentialSuccess, eventData);
  },

  fireMessageToParent: function <T extends PostMessageData>(method: MethodName, data?: T) {
    const message = <PostMessageInput<T>>{
      method: method,
      data: <T>data
    };
    this._postMessage(message);
  },

  /**
   * Update notification count to render on portal sidebar
   * @param eventData
   */
  updateNotificationCount: function (eventData: UpdateNoticationData) {
    const message = <PostMessageInput<any>>{
      method: MethodName.UpdateNotificationCount,
      data: eventData
    };
    this._postMessage(message);
  },

  sendWebSocketMsg: function (params) {
    const message = <PostMessageInput<any>>{
      method: MethodName.SendWebSocketMsg,
      data: params
    };
    this._postMessage(message);
  },

  /*
   * Hides the Payment Modal shown by triggering either the Topup or Subscribe APIs.
   *
   * Most of the time this is ONLY called by the Payment Modal itself when it's close button is clicked on
   */
  hideTopup: function () {
    const message = <PostMessageInput<any>>{
      method: MethodName.HideTopup
    };
    this._postMessage(message);
  },

  /*
   * Installs app in the current view and shows the app in the content. If app is already installed,
   * then this will simply shows the app in the content
   *
   * appId: appId to install and show
   */
  activateApp: function (appId: string) {
    const message = <PostMessageInput<ActivateAppData>>{
      method: MethodName.ActivateApp,
      data: {
        orgUuid: this.orgUuid,
        appId: appId
      }
    };
    this._postMessage(message);
  },

  /*
   * Shows a warning message on the top right corner of the user portal
   */
  showWarn: function (message: string, title?: string) {
    this._showMessage('warn', title, message);
  },

  /*
   * Shows a success message on the top right corner of the user portal
   */
  showSuccess: function (message: string, title?: string) {
    this._showMessage('success', title, message);
  },

  authenticate() {
    const message = <PostMessageInput<any>>{
      method: MethodName.ShowAuth
    };
    this._postMessage(message);
  },

  showAuth: function () {
    this.authenticate();
  },

  hideAuth: function () {
    const message = <PostMessageInput<any>>{
      method: MethodName.HideAuth
    };
    this._postMessage(message);
  },

  showAddMemberModal: function () {
    const message = <PostMessageInput<any>>{
      method: MethodName.ShowAddMemberModal
    };
    this._postMessage(message);
  },

  hideAddMemberModal: function () {
    const message = <PostMessageInput<any>>{
      method: MethodName.HideAddMemberModal
    };
    this._postMessage(message);
  },

  showCreateCredentialModal: function (memberUuid, email) {
    const message = <PostMessageInput<CreateCredentialModal>>{
      method: MethodName.ShowCreateCredentialModal,
      data: <CreateCredentialModal>{
        memberUuid: memberUuid,
        email: email,
        orgUuid: this.orgUuid
      }
    };
    this._postMessage(message);
  },

  hideCreateCredentialModal: function () {
    const message = <PostMessageInput<any>>{
      method: MethodName.HideCreateCredentialModal
    };
    this._postMessage(message);
  },

  hideSelectOrgModal: function () {
    const message = <PostMessageInput<any>>{
      method: MethodName.HideSelectOrgModal
    };
    this._postMessage(message);
  },

  getCredentialsInfo() {
    const message = <PostMessageInput<any>>{
      method: MethodName.GetCredentialsInfo
    };
    this._postMessage(message);
  },

  getCredentialsInfoEventListener: function (eventCallback) {
    return this._addEventListener(EventMapName.getCredentialsInfo, eventCallback);
  },

  triggerEventName: function (eventName: EventMapName, eventData: EventMapListener[EventMapName]) {
    return this._triggerEvent(eventName, eventData);
  },

  registerListener: function (eventName: EventMapName, listener: EventMapListener[EventMapName], onceOnly = false) {
    return this._addEventListener(eventName, listener, onceOnly);
  },

  removeEventListener: function (eventName: EventMapName) {
    if (this.listeners[eventName]) {
      delete this.listeners[eventName];
    }
  },

  /*
   * -----------------------------------------------------------------------------------------------------
   * 	Private functions below here
   * -----------------------------------------------------------------------------------------------------
   */

  _initContext: function (env) {
    const urlParams = {};
    let match;
    const pl = /\+/g, // Regex for replacing addition symbol with a space
      search = /([^&=]+)=?([^&]*)/g,
      decode = function (s: string) {
        return decodeURIComponent(s.replace(pl, ' '));
      };

    let query = window.location.search.substring(1);
    if (!query) {
      query = window.location.hash.split('?')[1];
    }

    while ((match = search.exec(query))) {
      urlParams[decode(match[1])] = decode(match[2]);
    }
    this.orgUuid = urlParams[ORG_UUID];
    this.sessionToken = urlParams[SESSION_TOKEN];
    if (!this.sessionToken) {
      const cookieInfo = this._getCookieInfo() as string;
      if (cookieInfo) {
        const cookie = JSON.parse(cookieInfo);
        this.sessionToken = cookie['sessionId'] || cookie['sessionToken'];
        if (!this.orgUuid) {
          this.orgUuid = cookie['latestOrgId'] || cookie['orgUuid'];
        }
      }
    }
    if (env) {
      if (env === 'local') {
        this._enableLocal();
      }
    } else {
      const domain = window.location.hostname;
      if (domain === 'localhost' || domain === '127.0.0.1') {
        this._enableLocal();
      }
    }
  },

  _enableLocal() {
    if (this.orgUuid && this.sessionToken) {
      this._putContext(this.sessionToken, this.orgUuid);
    } else {
      const cookieInfo = this._getCookieInfo();
      if (cookieInfo) {
        const cookie = JSON.parse(cookieInfo);
        this.sessionToken = cookie['sessionId'];
        this.orgUuid = cookie[ORG_UUID];
      }
    }
  },

  _putContext: function (sessionToken, orgUuid) {
    const session = {
      sessionId: sessionToken,
      orgUuid: orgUuid
    };
    document.cookie = `session=` + encodeURIComponent(JSON.stringify(session)) + ';path=/';
  },

  // Deprecated (used for store app in external context)
  _getCookieInfo(): string {
    const session = this._getCookie('session'); // get session for new login flow
    if (session) {
      return session;
    }

    let domain = window.location.hostname;
    if (domain.startsWith('portal-uat')) {
      domain += 'UAT';
    }
    const decodedCookie = decodeURIComponent(document.cookie);
    if (decodedCookie.indexOf('session_' + domain) > -1) {
      return this._getCookie('session_' + domain);
    } else {
      const index = decodedCookie.indexOf('session_');
      if (index > -1) {
        const temp = decodedCookie.substring(index + 8);
        let firstPortalDomain = temp.substring(0, temp.indexOf('='));
        if (firstPortalDomain.endsWith('UAT')) {
          firstPortalDomain = firstPortalDomain.substring(0, firstPortalDomain.length - 3);
        }
        return JSON.stringify({ redirectDomain: firstPortalDomain });
      } else {
        return this._getCookie('session');
      }
    }
  },

  _getCookie: function (cname) {
    const name = cname + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return '';
  },

  _postMessage<T extends PostMessageData>(message: PostMessageInput<T>) {
    if (message) {
      message.data = message.data || <T>{};
      message.data.orgUuid = this.orgUuid;
      window.top.postMessage(JSON.stringify(message), '*');
    }
  },

  _onMessage(e) {
    try {
      const message = JSON.parse(e.data);

      //Get the event name and data
      const eventName = message.eventName;
      const eventData = message.eventData;

      //Trigger all listeners for this event
      this._handleEvents(eventName, eventData);
    } catch (error) {
      // console.error('wrong format message: ', e.data);
    }
  },

  /*
   * Handle all listeners for a single event
   */
  _handleEvents(eventName: EventMapName, eventData: EventMapListener[EventMapName]) {
    //Trigger all listeners for this event
    if (this.listeners[eventName]) {
      for (let i = 0; i < this.listeners[eventName].length; i++) {
        const eventListenerObj = this.listeners[eventName][i];
        eventListenerObj.listener(eventData);

        //If this event listener is to be run once only, we need to remove it after executing
        if (eventListenerObj.onceOnly) {
          this._removeEventListener(eventName, eventListenerObj.listenerId);
        }
      }
    }
  },

  /*
   * Triggers an event. This is a private function, you should use the more specific event trigger functions instead.
   *
   * eventName: Event name to trigger. Possible values are 'call', 'sms'
   * eventData: A javascript object denoting the eventData.
   */
  _triggerEvent: function (eventName: EventMapName, eventData?: EventMapListener[EventMapName]) {
    const message = <PostMessageInput<TriggerEventData>>{
      method: MethodName.TriggerEvent,
      data: <TriggerEventData>{
        orgUuid: this.orgUuid,
        eventName: eventName,
        eventData: eventData
      }
    };
    this._postMessage(message);
  },

  /*
   * Adds a event listener. This is a private function, you should use the more specific event listener functions instead.
   *
   * eventName: Event name to listen to.
   * onEvent: A function to be called when the event occurs. This function will be passed
   *			a single javascript object as parameter. Note that this behaviour is overridden for specific listener functions.
   * onceOnly: Determines if the listener will only activate once
   * returns: The listenerId which can be used to remove the event listener later
   */
  _addEventListener: function (eventName: EventMapName, onEvent: EventMapListener[EventMapName], onceOnly: boolean) {
    const message = <PostMessageInput<TriggerEventData>>{
      method: MethodName.AddEventListener,
      data: <TriggerEventData>{
        eventName: eventName,
        orgUuid: this.orgUuid
      }
    };
    this._postMessage(message);
    this.listeners[eventName] = this.listeners[eventName] || [];

    //Generate the listener id by using the time in milliseconds, appended by a random number
    const listenerId = new Date().getTime() + '.' + Math.random() * 10000;
    this.listeners[eventName].push(<ListenerX>{ listenerId: listenerId, listener: onEvent, onceOnly: onceOnly });
    return listenerId;
  },

  /*
   * Removes an event listener for the specified event name at the specified event index
   */
  _removeEventListener: function (eventName: EventMapName, listenerId) {
    if (this.listeners[eventName]) {
      //Find the index of the handler
      for (let i = 0; i < this.listeners[eventName]?.length; i++) {
        const eventListenerObj = this.listeners[eventName][i];
        if (eventListenerObj.listenerId === listenerId) {
          //Found the listener. Remove and break out of loop
          this.listeners[eventName].splice(i, 1);
          break;
        }
      }
    }
  },

  _showMessage: function (type, title, message) {
    const postMessage = <PostMessageInput<any>>{
      method: MethodName.ShowMessage,
      data: {
        type: type,
        title: title,
        message: message
      }
    };
    this._postMessage(postMessage);
  }
};

export { X };
