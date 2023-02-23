const ORG_UUID = 'orgUuid';
const SESSION_TOKEN = 'sessionToken';
/*
 * X Javascript API v1.0.0
 *
 */
var X = {
  isStarted: false,
  orgUuid: '',
  sessionToken: '',
  listeners: {},

  /*
   * Initializes the event listeners if it was not already started
   * env is in ["local", "uat", "prod"]
   */

  init: function (env) {
    if (!this.isStarted) {
      this.isStarted = true;
      var _this = this;
      var _tmp = function (event) {
        _this._onMessage(event);
      };
      if (window.addEventListener) {
        window.addEventListener('message', _tmp, false);
      } else {
        window.attachEvent('onmessage', _tmp);
      }
      this._initContext(env);
    }
  },

  _initContext: function (env) {
    var urlParams = {};
    var match,
      pl = /\+/g, // Regex for replacing addition symbol with a space
      search = /([^&=]+)=?([^&]*)/g,
      decode = function (s) {
        return decodeURIComponent(s.replace(pl, ' '));
      },
      query = window.location.search.substring(1);

    if (!query) {
      query = window.location.hash.split('?')[1];
    }

    while ((match = search.exec(query))) {
      urlParams[decode(match[1])] = decode(match[2]);
    }
    this.orgUuid = urlParams[ORG_UUID];
    this.sessionToken = urlParams[SESSION_TOKEN];
    if (!this.sessionToken) {
      let cookieInfo = this.getCookieInfo();
      if (cookieInfo != null && cookieInfo) {
        let cookie = JSON.parse(cookieInfo);
        this.sessionToken = cookie['sessionId'] || cookie['sessionToken'];
        if (!this.orgUuid) {
          this.orgUuid = cookie['latestOrgId'] || cookie['orgUuid'];
        }
      }
    }
    if (env) {
      if (env == 'local') {
        this._enableLocal();
      }
    } else {
      var domain = window.location.hostname;
      if (domain == 'localhost' || domain == '127.0.0.1') {
        this._enableLocal();
      }
    }
  },

  _enableLocal() {
    if (this.orgUuid && this.sessionToken) {
      this._putContext(this.sessionToken, this.orgUuid);
    } else {
      let cookieInfo = this._getCookie('session');
      if (cookieInfo != null && cookieInfo) {
        let cookie = JSON.parse(cookieInfo);
        this.sessionToken = cookie['sessionId'];
        this.orgUuid = cookie[ORG_UUID];
      }
    }
  },

  /*
   * Adds a Company Change Event listener which is triggered when some company information has changed.
   *
   * onCompanyChangeEvent: A function to be called when the company change event occurs. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addLanguageChangeEventListener: function (onLanguageChangeEvent) {
    return this._addEventListener('language', onLanguageChangeEvent);
  },

  /*
   * Adds a Company Change Event listener which is triggered when some company information has changed.
   *
   * onCompanyChangeEvent: A function to be called when the company change event occurs. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addCompanyChangeEventListener: function (onCompanyChangeEvent) {
    return this._addEventListener('company', onCompanyChangeEvent);
  },

  /*
   * Adds a IdentityChange listener which is triggered when there is any IdentityChange event is pushed to portal.
   *
   * onIdentityChangeEvent: A function to be called when there is any IdentityChange event is pushed to portal. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addIdentityChangeListener: function (onIdentityChangeEvent) {
    return this._addEventListener('identityChange', onIdentityChangeEvent);
  },

  /*
   * Adds a Payment Change Event listener which is triggered when some payment information or billing details has been changed.
   *
   * onPaymentChangeEvent: A function to be called when the payment event occurs. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addPaymentChangeEventListener: function (onPaymentChangeEvent) {
    return this._addEventListener('payment', onPaymentChangeEvent);
  },

  /*
   * Adds a Member Change Event listener which is triggered when some member information has been changed.
   *
   * onMemberChangeEvent: A function to be called when the member event occurs. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addMemberChangeEventListener: function (onMemberChangeEvent) {
    return this._addEventListener('member', onMemberChangeEvent);
  },

  /**
   * Trigger invite new member event
   */
  triggerMemberChangeEvent: function () {
    this._triggerEvent('member');
  },

  /*
   * Adds a Firebase Msg Event listener which is triggered when there is any msg is pushed to portal.
   *
   * onFirebaseMsgEvent: A function to be called when there is any msg is pushed to portal. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addFirebaseMsgEventListener: function (onFirebaseMsgEvent) {
    return this._addEventListener('firebaseMsg', onFirebaseMsgEvent);
  },

  /*
   * Adds a inviteNewMember event listener which is triggered when there is any inviteNewMember event is pushed to portal.
   *
   * onInviteNewMemberEvent: A function to be called when there is any inviteNewMember event is pushed to portal. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addInviteNewMemberEventListener: function (onInviteNewMemberEvent) {
    return this._addEventListener('inviteNewMember', onInviteNewMemberEvent);
  },

  /*
   * Active application event listener which is triggered when there is any msg event is pushed to portal.
   *
   * onActiveApplicationEventListener: A function to be called when there is any activeApplication event is pushed to portal. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  activeApplicationEventListener: function (onActiveApplicationEventListener) {
    return this._addEventListener('activeApplication', onActiveApplicationEventListener);
  },

  /**
   * Trigger invite new member event
   */
  triggerInviteNewMemberEvent: function () {
    this._triggerEvent('inviteNewMember');
  },

  /*
   * Adds a View Pending Invite listener which is triggered when there is any viewPendingInvite event is pushed to portal.
   *
   * onViewPendingInviteEvent: A function to be called when there is any viewPendingInvite event is pushed to portal. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addViewPendingInviteEventListener: function (onViewPendingInviteEvent) {
    return this._addEventListener('viewPendingInvite', onViewPendingInviteEvent);
  },

  /**
   * Trigger view pending invite event
   */
  triggerViewPendingInviteEvent: function () {
    this._triggerEvent('viewPendingInvite');
  },

  /*
   * Adds a View Billing Info listener which is triggered when there is any viewBillingInfo event is pushed to portal.
   *
   * onViewBillingInfoEvent: A function to be called when there is any viewBillingInfo event is pushed to portal. No parameters are passed.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addViewBillingInfoEventListener: function (onViewBillingInfoEvent) {
    return this._addEventListener('viewBillingInfo', onViewBillingInfoEvent);
  },

  /**
   * Trigger view billing info event
   */
  triggerViewBillingInfoEvent: function () {
    this._triggerEvent('viewBillingInfo');
  },

  /*
   * Adds a add member success listener which is triggered when member is added successfully.
   *
   * onAddMemberSuccessEvent: A function to be called when member is added successfully.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addMemberSuccessEventListener: function (onAddMemberSuccessEvent) {
    return this._addEventListener('addMemberSuccess', onAddMemberSuccessEvent);
  },

  /**
   * Trigger add member success event
   */
  triggerAddMemberSuccessEvent: function (eventData) {
    this._triggerEvent('addMemberSuccess', eventData);
  },

  /*
   * create credential success listener which is triggered when create credential successfully.
   *
   * createCredentialSuccessEvent: A function to be called when member is added successfully.
   *
   * returns the listener id which can be used to remove this event later.
   */
  addCreateCredentialSuccessEventListener: function (createCredentialSuccessEvent) {
    return this._addEventListener('createCredentialSuccess', createCredentialSuccessEvent);
  },

  /**
   * Trigger add create credential success event
   */
  triggerCreateCredentialSuccessEvent: function (eventData) {
    this._triggerEvent('createCredentialSuccess', eventData);
  },

  /**
   * Update notification count to render on portal sidebar
   * @param eventData:  {notification: number}
   */
  updateNotificationCount: function (eventData) {
    const message = {
      method: 'UpdateNotificationCount',
      data: eventData
    };
    this._postMessage(message);
  },

  showSidebar: function () {
    var message = {
      method: 'ShowSidebar',
      data: {}
    };
    this._postMessage(message);
  },

  /*
   * Causes the user portal to update the payment
   */
  updatedPayment: function (orgUuid) {
    var message = {
      method: 'UpdatedPayment',
      data: {
        orgUuid: orgUuid
      }
    };
    this._postMessage(message);
  },

  /*
   * Opens the topup dialogue
   *
   */
  topup: function () {
    var message = {
      method: 'Topup'
    };
    this._postMessage(message);
  },

  /*
   * Hides the Payment Modal shown by triggering either the Topup or Subscribe APIs.
   *
   * Most of the time this is ONLY called by the Payment Modal itself when it's close button is clicked on
   */
  hidePayment: function () {
    var message = {
      method: 'HidePayment'
    };
    this._postMessage(message);
  },

  /*
   * Hides the Payment Modal shown by triggering either the Topup or Subscribe APIs.
   *
   * Most of the time this is ONLY called by the Payment Modal itself when it's close button is clicked on
   */
  hideTopup: function () {
    var message = {
      method: 'HideTopup'
    };
    this._postMessage(message);
  },

  /*
   * Installs app in the current view and shows the app in the content. If app is already installed,
   * then this will simply shows the app in the content
   *
   * appId: appId to install and show
   */
  activateApp: function (appId) {
    var message = {
      method: 'ActivateApp',
      data: {
        appId: appId
      }
    };
    this._postMessage(message);
  },

  /*
   * Causes the user portal to update the company list
   *
   * orgId is optional, if omitted it is automatically derived from the calling frame
   */
  updatedCompany: function (orgId) {
    var message = {
      method: 'UpdatedCompany',
      data: {
        orgId: orgId
      }
    };
    this._postMessage(message);
  },

  /*
   * Causes the user portal to update the company list
   *
   * orgId is optional, if omitted it is automatically derived from the calling frame
   */
  deletedCompany: function (orgId) {
    var message = {
      method: 'DeletedCompany',
      data: {
        orgId: orgId
      }
    };
    this._postMessage(message);
  },

  /*
   * Shows a warning message on the top right corner of the user portal
   */
  showWarn: function (message, title) {
    this._showMessage('warn', title, message);
  },

  /*
   * Shows a success message on the top right corner of the user portal
   */
  showSuccess: function (message, title) {
    this._showMessage('success', title, message);
  },

  authenticate() {
    var message = {
      method: 'ShowAuth'
    };
    this._postMessage(message);
  },

  showAuth: function () {
    this.authenticate();
  },

  hideAuth: function () {
    var message = {
      method: 'HideAuth'
    };
    this._postMessage(message);
  },

  showAddMemberModal: function () {
    var message = {
      method: 'ShowAddMemberModal'
    };
    this._postMessage(message);
  },

  hideAddMemberModal: function () {
    var message = {
      method: 'HideAddMemberModal'
    };
    this._postMessage(message);
  },

  showCreateCredentialModal: function (memberUuid, email) {
    var message = {
      method: 'ShowCreateCredentialModal',
      data: {
        memberUuid: memberUuid,
        email: email
      }
    };
    this._postMessage(message);
  },

  hideCreateCredentialModal: function () {
    var message = {
      method: 'HideCreateCredentialModal'
    };
    this._postMessage(message);
  },

  hideSelectOrgModal: function () {
    var message = {
      method: 'HideSelectOrgModal'
    };
    this._postMessage(message);
  },

  // Deprecated (used for store app in external context)
  getCookieInfo: function () {
    const session = this._getCookie('session'); // get session for new login flow
    if (session) {
      return session;
    }

    let domain = this._getPortalDomain();
    if (domain.startsWith('portal-uat')) {
      if (window.location.hostname != 'localhost') {
        domain += 'UAT';
      }
    }
    var decodedCookie = decodeURIComponent(document.cookie);
    if (decodedCookie.indexOf('session_' + domain) > -1) {
      return this._getCookie('session_' + domain);
    } else {
      var index = decodedCookie.indexOf('session_');
      if (index > -1) {
        let temp = decodedCookie.substring(index + 8);
        var firstPortalDomain = temp.substring(0, temp.indexOf('='));
        if (firstPortalDomain.endsWith('UAT')) {
          firstPortalDomain = firstPortalDomain.substring(0, firstPortalDomain.length - 3);
        }
        return JSON.stringify({ redirectDomain: firstPortalDomain });
      } else {
        return '';
      }
    }
  },

  getContext: function () {
    let params = {};
    params[ORG_UUID] = this.orgUuid;
    params[SESSION_TOKEN] = this.sessionToken;
    return params;
  },

  getPurchaseUrl: function (sessionToken, orgId, productId) {
    let result;
    try {
      result = window.top.location.origin + '/paymentV2/#/purchase/' + sessionToken + '/' + orgId + '/' + productId;
    } catch (ex) {
      result = document.referrer + 'paymentV2/#/purchase/' + sessionToken + '/' + orgId + '/' + productId;
    }
    return result;
  },

  /*
   * -----------------------------------------------------------------------------------------------------
   * 	Private functions below here
   * -----------------------------------------------------------------------------------------------------
   */

  _putContext: function (sessionToken, orgUuid) {
    var session = {
      sessionId: sessionToken,
      orgUuid: orgUuid
    };
    document.cookie = 'session=' + encodeURIComponent(JSON.stringify(session)) + ';path=/';
  },

  _getCookie: function (cname) {
    var name = cname + '=';
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return '';
  },

  _getPortalDomain() {
    return window.location.hostname;
  },

  _postMessage: function (message) {
    window.top.postMessage(JSON.stringify(message), '*');
  },

  _onMessage: function (e) {
    try {
      var message = JSON.parse(e.data);

      //Get the event name and data
      var eventName = message.eventName;
      var eventData = message.eventData;

      //Trigger all listeners for this event
      this._handleEvents(eventName, eventData);
    } catch (error) {
      console.log('wrong format message: ' + e.data);
    }
  },

  /*
   * Handle all listeners for a single event
   */
  _handleEvents: function (eventName, eventData) {
    //Trigger all listeners for this event
    if (this.listeners[eventName]) {
      for (var i = 0; i < this.listeners[eventName].length; i++) {
        var eventListenerObj = this.listeners[eventName][i];
        this._handleEvent(eventListenerObj.listener, eventName, eventData);

        //If this event listener is to be run once only, we need to remove it after executing
        if (eventListenerObj.onceOnly) {
          this._removeEventListener(eventName, eventListenerObj.listenerId);
        }
      }
    }
  },

  /*
   * Handle a single listener for a single event
   */
  _handleEvent: function (listener, eventName, eventData) {
    listener(eventData);
  },

  /*
   * Triggers an event. This is a private function, you should use the more specific event trigger functions instead.
   *
   * eventName: Event name to trigger. Possible values are 'call', 'sms'
   * eventData: A javascript object denoting the eventData.
   */
  _triggerEvent: function (eventName, eventData) {
    var message = {
      method: 'TriggerEvent',
      data: {
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
  _addEventListener: function (eventName, onEvent, onceOnly) {
    var message = {
      method: 'AddEventListener',
      data: {
        eventName: eventName
      }
    };
    this._postMessage(message);
    this.listeners[eventName] = this.listeners[eventName] || [];

    //Generate the listener id by using the time in milliseconds, appended by a random number
    var listenerId = new Date().getTime() + '.' + Math.random() * 10000;
    this.listeners[eventName].push({
      listenerId: listenerId,
      listener: onEvent,
      onceOnly: onceOnly
    });
    return listenerId;
  },

  /*
   * Removes an event listener for the specified event name at the specified event index
   */
  _removeEventListener: function (eventName, listenerId) {
    if (this.listeners[eventName]) {
      //Find the index of the handler
      for (var i = 0; i < this.listeners[eventName].length; i++) {
        var eventListenerObj = this.listeners[eventName][i];
        if (eventListenerObj.listenerId === listenerId) {
          //Found the listener. Remove and break out of loop
          this.listeners[eventName].splice(i, 1);
          break;
        }
      }
    }
  },

  _showMessage: function (type, title, message) {
    var postMessage = {
      method: 'ShowMessage',
      data: {
        type: type,
        title: title,
        message: message
      }
    };
    this._postMessage(postMessage);
  }
};
