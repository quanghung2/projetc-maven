import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Contact } from '@b3networks/api/contact';
import { ReconnectChatStragery, User } from '@b3networks/api/workspace';
import { DomainUtilsService, LocalStorageUtil } from '@b3networks/shared/common';
import { debug, UA, WebSocketInterface } from 'jssip';
import { causes, DTMF_TRANSPORT } from 'jssip/lib/Constants';
import { EndEvent, RTCSession, SendingEvent } from 'jssip/lib/RTCSession';
import {
  CallOptions,
  IncomingRTCSessionEvent,
  OutgoingRTCSessionEvent,
  UAConfiguration,
  UnRegisteredEvent
} from 'jssip/lib/UA';
import { DisconnectEvent } from 'jssip/lib/WebSocketInterface';
import { Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { TypeSound } from '../audio-player/audio-player.model';
import { AudioPlayerService } from './../audio-player/audio-player.service';
import { Originator, SessionDirection, SipResponse, TimerCall, UAEventStatus } from './webrtc.model';
import { WebrtcQuery } from './webrtc.query';
import { WebrtcStore } from './webrtc.store';

// declare let JSSip: any;

class WebrtcInitData {
  username: string;
  endpoint: string;
  port: string;
  sipUsername: string;
  sipPassword: string;
  userAgent: string;
  sturn: string;
  domain: string;
  expiredAt: number;

  constructor(obj?: Partial<WebrtcInitData>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  /**
   * return `wss://${this.endpoint}${this.port ? ':' + this.port : ''}`;
   * sudo su
   * ping sip-wss-1.b3networks.com
   * netstat -ln | grep 443 |grep 13.251.192.231
   */
  get wsUrl() {
    const split = this.endpoint.split('sip-wss-');
    if (split.length >= 2) {
      const number = split[1][0] || '';
      if (number) {
        return `wss://${`${this.domain}/_c${number}`}${this.port ? ':' + this.port : ''}/`;
      }
    }
    return this.endpoint ? `wss://${this.endpoint}${this.port ? ':' + this.port : ''}` : '';
  }

  get sipAddress() {
    return `${this.endpoint}${this.port ? ':' + this.port : ''}`;
  }

  getSipAddress() {
    return `sip:${this.sipUsername.replace(':', '')}@${this.endpoint}${this.port ? ':' + this.port : ''}`;
  }
}

export const EXPIRY_CREDENTIAL_ACCOUNT_INSECONDS = 8 * 60 * 60; // 8h
export const EXPIRY_REGISTER_SIP_INSECONDS = 30 * 60; // 30m
export const KEY_CACHE_CREDENTIAL_ACCOUNT = 'credential-account-v2';

@Injectable({
  providedIn: 'root'
})
export class WebrtcService {
  private _RTCConstraints = {
    optional: [],
    mandatory: {
      offerToReceiveAudio: true,
      offerToReceiveVideo: false
    }
  };
  private _callOptions = <CallOptions>{
    mediaConstraints: { audio: true, video: false },
    pcConfig: {
      iceServers: []
    },
    rtcOfferConstraints: this._RTCConstraints,
    eventHandlers: {
      sending: (event: SendingEvent) => {
        console.log('🚀 ~ event', event);
      }
    }
  };

  private _keyCache: string;
  private _socket: WebSocketInterface;
  private _cred: WebrtcInitData;
  private _reconnectStragery = new ReconnectChatStragery({
    maxReconnect: 15
  });
  private _reconnectStrageryAuthenticationFailed = new ReconnectChatStragery({
    maxReconnect: 5
  });
  private _isConnecting: boolean;
  private _dtmfQueue: string;

  constructor(
    private http: HttpClient,
    private store: WebrtcStore,
    private query: WebrtcQuery,
    private audioPLayerService: AudioPlayerService,
    private domainUtilsService: DomainUtilsService
  ) {
    debug.disable();
    // debug.enable('JsSIP:*');
  }

  init(key: string): Observable<UA> {
    console.log('key: ', key);
    this._isConnecting = true;
    let credCache;
    try {
      credCache = JSON.parse(LocalStorageUtil.getItem(key));
    } catch (error) {
      console.log('🚀 ~ error', error);
    }

    return (
      credCache
        ? of(new WebrtcInitData(credCache))
        : this.generateSipRTC().pipe(
            tap((cred: WebrtcInitData) => {
              LocalStorageUtil.setItem(key, JSON.stringify(cred), cred.expiredAt); // cache credential account
            })
          )
    ).pipe(
      switchMap((cred: WebrtcInitData) => {
        this._cred = cred;
        console.log('cred: ', this._cred, 'from cache:', !!credCache);
        this._keyCache = key;
        this._reconnectStrageryAuthenticationFailed.reset();

        this.setupUAConfiguration();
        try {
          this.start();
        } catch (error) {
          console.error('🚀 ~ error', error);
          return of(null);
        }

        return of(this.query.UA);
      })
    );
  }

  updateUAConfiguration<T extends keyof UAConfiguration>(parameter: T, value: UAConfiguration[T]) {
    this.query?.UA?.set(parameter, value);
  }

  stop() {
    if (this.query.UA) {
      this.query.UA.stop();
    }
  }

  doDTMF(tone: number | string, sleep = 600) {
    if (!tone) {
      return;
    }

    if (this._dtmfQueue) {
      this._dtmfQueue += tone.toString();
      return;
    }
    this._dtmfQueue = tone.toString();
    this._sendQueuedDTMF(sleep);
  }

  doRejectCall() {
    const session = this.query.session;
    session?.terminate();
  }

  doToggleHold() {
    const currentHold = this.query.callManagement.isHold;
    // switch value
    this.store.update(state => ({
      ...state,
      callManagement: {
        ...state.callManagement,
        isHold: !currentHold
      }
    }));
    const session = this.query.session;
    if (currentHold) {
      session?.unhold();
    } else {
      session?.hold();
    }
  }

  doToggleMute() {
    const currentMute = this.query.callManagement.isMute;
    // switch value
    this.store.update(state => ({
      ...state,
      callManagement: {
        ...state.callManagement,
        isMute: !currentMute
      }
    }));
    const session = this.query.session;
    if (currentMute) {
      session?.unmute();
    } else {
      session?.mute();
    }
  }

  doZoom(isZoom: boolean) {
    this.store.update(state => ({
      ...state,
      callManagement: {
        ...state.callManagement,
        isZoom: isZoom
      }
    }));
  }

  updateRoom(isRoom: boolean) {
    this.store.update(state => ({
      ...state,
      callManagement: {
        ...state.callManagement,
        isRoom: isRoom
      }
    }));
  }

  doAnswerIncoming() {
    const session = this.query.session;
    session.answer(this._callOptions);
  }

  handleCall(session: RTCSession) {
    console.log('session: ', session);
    // Avoid if busy or other incoming
    if (this.query.session) {
      session.terminate({
        status_code: 486,
        reason_phrase: 'Busy Here'
      });
      return;
    }

    // initial UI
    this.store.update(state => ({
      ...state,
      session: session,
      callManagement: {
        ...state.callManagement,
        isRemote: session.direction === SessionDirection.INCOMING,
        timerCall: new TimerCall()
      }
    }));

    session.on('connecting', () => {
      console.log('connecting: ');
      this.store.update(state => ({ ...state, session: session }));
    });

    session.on('progress', () => {
      console.log('progress: ');
      if (session.direction === SessionDirection.OUTGOING) {
        this.audioPLayerService.play(TypeSound.ringing, true);
      } else {
        this.audioPLayerService.play(TypeSound.ringback, true);
      }
      this.store.update(state => ({
        ...state,
        callManagement: {
          ...state.callManagement,
          ringing: true
        }
      }));
    });

    session.on('failed', (event: EndEvent) => {
      console.log('failed: ', event);
      this.store.update({
        statusUA: {
          status: UAEventStatus.failed,
          reason: event?.cause
        }
      });
      this.audioPLayerService.play(TypeSound.rejected);
      this.query.callManagement.timerCall.clearIntervalTime();
      this.store.update(state => ({ ...state, session: null, callManagement: null }));

      if (event?.originator === Originator.REMOTE) {
        if (event?.cause === 'Authentication Error') {
          if (this._reconnectStrageryAuthenticationFailed.canReconnect) {
            setTimeout(() => {
              this.query.UA.register();
            }, 4000);
            this._reconnectStrageryAuthenticationFailed.increaseReconnectTime();
          } else {
            LocalStorageUtil.removeItem(this._keyCache);
            this.init(this._keyCache).subscribe();
          }
        }
      }
    });

    session.on('ended', () => {
      console.log('ended: ');
      this.audioPLayerService.play(TypeSound.rejected);
      this.query.callManagement.timerCall.clearIntervalTime();
      this.store.update(state => ({ ...state, session: null, callManagement: null }));
    });

    session.on('accepted', () => {
      console.log('accepted: ');
      this.audioPLayerService.stop();
      this.store.update(state => ({
        ...state,
        session: session,
        callManagement: {
          ...state.callManagement,
          canHold: true,
          canDTMF: true,
          ringing: false
        }
      }));
      this.query.callManagement.timerCall.countTimeCall();
    });

    session.on('hold', () => {
      this.audioPLayerService.play(TypeSound.hold, true);
      this.store.update(data => ({
        ...data,
        callManagement: {
          ...data.callManagement,
          isHold: true
        }
      }));
    });

    session.on('unhold', () => {
      this.audioPLayerService.play(TypeSound.answered);
      this.store.update(data => ({
        ...data,
        callManagement: {
          ...data.callManagement,
          isHold: false
        }
      }));
    });
  }

  makeCallOutgoing(number: string, member: Contact | User, isMeeting?: boolean) {
    // Avoid if busy or other incoming
    if (!number || this.query.session) {
      return;
    }

    if (isMeeting) {
      this.updateRoom(true);
    }

    if (member) {
      this.store.update(data => ({
        ...data,
        callManagement: {
          ...data.callManagement,
          member: member instanceof Contact ? new Contact(member) : new User(member)
        }
      }));
    }

    this.query.UA.call(number, this._callOptions);
  }

  private start() {
    console.log('start: ');

    if (this.query.UA?.isRegistered()) {
      throw 'Start failed';
    }

    const authorizationCurrent = this._cred.sipUsername;
    this.query.UA.on('connecting', () => {
      if (authorizationCurrent !== this._cred.sipUsername) {
        return;
      }

      this.store.update({ statusUA: { status: UAEventStatus.connecting } });
    });

    this.query.UA.on('connected', () => {
      if (authorizationCurrent !== this._cred.sipUsername) {
        return;
      }

      this._isConnecting = false;
      this.store.update({ statusUA: { status: UAEventStatus.connected } });
      this.query.UA.register();
    });

    this.query.UA.on('disconnected', (event: DisconnectEvent) => {
      if (authorizationCurrent !== this._cred.sipUsername) {
        return;
      }

      console.log('disconnected WEBRTC socket: ', event);
      this.store.update({ statusUA: { status: UAEventStatus.disconnected } });
      this.reconnectJSSip();
    });

    this.query.UA.on('registered', () => {
      if (authorizationCurrent !== this._cred.sipUsername) {
        return;
      }

      this.store.update({ statusUA: { status: UAEventStatus.registered } });
    });

    this.query.UA.on('unregistered', () => {
      if (authorizationCurrent !== this._cred.sipUsername) {
        return;
      }

      this.store.update({ statusUA: { status: UAEventStatus.unregistered } });
    });

    this.query.UA.on('registrationFailed', (event: UnRegisteredEvent) => {
      console.log('registrationFailed: ', event, authorizationCurrent !== this._cred.sipUsername);
      if (authorizationCurrent !== this._cred.sipUsername) {
        return;
      }

      this.store.update({ statusUA: { status: UAEventStatus.registrationFailed } });

      if (event?.response?.status_code === 401 || event?.cause === causes.CONNECTION_ERROR) {
        console.log('canReconnect Authentication Failed: ', this._reconnectStrageryAuthenticationFailed.canReconnect);
        if (this._reconnectStrageryAuthenticationFailed.canReconnect) {
          setTimeout(() => {
            this.query.UA.register();
          }, 3000);
          this._reconnectStrageryAuthenticationFailed.increaseReconnectTime();
        } else {
          if (event?.response?.status_code === 401) {
            LocalStorageUtil.removeItem(this._keyCache);
          }
          this.init(this._keyCache).subscribe();
        }
      }
    });

    this.query.UA.on('registrationExpiring', () => {
      if (authorizationCurrent !== this._cred.sipUsername) {
        return;
      }

      this.store.update({ statusUA: { status: UAEventStatus.registrationExpiring } });
      this.query.UA.register();
    });

    // handle for incoming call only
    this.query.UA.on('newRTCSession', (data: IncomingRTCSessionEvent | OutgoingRTCSessionEvent) => {
      if (authorizationCurrent !== this._cred.sipUsername) {
        return;
      }

      this.handleCall(data.session);
    });
    this.query.UA.start();
  }

  private reconnectJSSip() {
    if (this._reconnectStragery.canReconnect) {
      if (!this._isConnecting) {
        setTimeout(() => {
          this._socket.disconnect();
          this.query.UA.start();
        }, this._reconnectStragery.waitingTime);

        this._reconnectStragery.increaseReconnectTime();
      }
    } else {
      console.log('JSSip reached reconnect times...');
    }
  }

  private setupUAConfiguration() {
    this._socket?.disconnect();

    this._socket = new WebSocketInterface(this._cred.wsUrl);
    const configuration: UAConfiguration = {
      sockets: [this._socket],
      uri: this._cred.getSipAddress(),
      password: this._cred.sipPassword,
      authorization_user: this._cred.sipUsername,
      session_timers: false,
      user_agent: 'B3networks',
      register_expires: EXPIRY_REGISTER_SIP_INSECONDS,
      no_answer_timeout: 120,
      register: false
    };
    this.store.update({ ua: new UA(configuration) });
  }

  private generateSipRTC(): Observable<WebrtcInitData> {
    return this.http
      .post<SipResponse>('/call/private/v1/webrtc/generate', {
        expiry: EXPIRY_CREDENTIAL_ACCOUNT_INSECONDS
      })
      .pipe(
        map(
          sip =>
            new WebrtcInitData({
              username: sip.username,
              endpoint: sip.domain,
              port: null,
              sipUsername: sip.fullUsername,
              sipPassword: sip.password,
              userAgent: 'B3networks',
              sturn: 'stun:stun.b3networks.com',
              domain: this.domainUtilsService.getPortalDomain(),
              expiredAt: sip.expiredAt
            })
        )
      );
  }

  private _sendQueuedDTMF(sleep: number) {
    if (!this._dtmfQueue || this._dtmfQueue?.length === 0) {
      this._dtmfQueue = undefined;
      return;
    }
    const tone = this._dtmfQueue.charAt(0);
    const session = this.query.session;
    if (session) {
      console.log('sendDTMF', tone);
      session?.sendDTMF(tone, { interToneGap: 400, transportType: DTMF_TRANSPORT.RFC2833 });
      // this.audioPLayerService.play(TypeSound.dial);
    }

    setTimeout(() => {
      this._dtmfQueue = this._dtmfQueue.substring(1);
      this._sendQueuedDTMF(sleep);
    }, sleep);
  }
}
