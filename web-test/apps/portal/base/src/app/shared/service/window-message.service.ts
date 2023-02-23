import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatMessage, ChatService, ChatTopic, SocketStatus } from '@b3networks/api/workspace';
import { ApplicationQuery, ApplicationService, SessionQuery, SessionService } from '@b3networks/portal/base/shared';
import {
  ActivateAppData,
  CallbackEventData,
  ChangedNavigateRouterData,
  EventMapFireData,
  EventMapName,
  MethodName,
  RegisterWebSocket,
  SendMessageEventData,
  TriggerEventData,
  UpdateNoticationData,
  UpdateTitleData
} from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap, isString } from '@datorama/akita';
import { filter, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WindowMessageService {
  listeners: HashMap<HTMLIFrameElement[]> = {};
  msgTypeRegister: HashMap<HTMLIFrameElement[]> = {};
  msgTopics: HashMap<ChatTopic[]> = {}; // orgUuid : ChatTopic[]

  constructor(
    private chatService: ChatService,
    private sessionQuery: SessionQuery,
    private sessionSerivce: SessionService,
    private appQuery: ApplicationQuery,
    private appService: ApplicationService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private title: Title
  ) {}

  // ===================== RECEIVE =========================
  init() {
    const domain = window.location.hostname;
    if (window.addEventListener) {
      window.addEventListener(
        'message',
        (event: MessageEvent) => {
          if (event.origin.includes('localhost') || event.origin.includes(domain)) {
            this.onMessage(event);
          }
        },
        false
      );
    }
  }

  sendMessageToWhatsapp(data: string, orgUuid: string) {
    console.log(`send message to whatsapp`, data);
    this.fireEvent(EventMapName.webSocketWhatsAppMsg, data, orgUuid);
  }

  sendUpdateDarkMode(data: boolean, orgUuid: string) {
    console.log(`send update dark mode`, data);
    this.fireEvent(EventMapName.updateDarkMode, data, orgUuid);
  }

  sendActiveApplication(data: { appId: string }, orgUuid: string) {
    console.log(`send active application`, data);
    this.fireEvent(EventMapName.activeApplication, data, orgUuid);
  }

  // ===================== SEND =========================
  fireEventAllRegisters(eventName: EventMapName, data: EventMapFireData[EventMapName], orgUuid: string) {
    this.fireEvent(eventName, data, orgUuid);
  }

  // only postmessage for mt list when RegisterWebsocket
  fireEventOnMessage(data: ChatMessage, orgUuid: string) {
    const respond = (iframe, msg) => {
      let result: boolean;
      if (iframe && !!msg) {
        const application = this.appQuery.getEntity(iframe.id);
        //Only send messages to frames in the same account view
        if (!orgUuid || (application && application.orgUuid === orgUuid)) {
          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage(msg, '*');
            result = true;
          }
        }
      }
      return result;
    };

    if (this.listeners[EventMapName.onMessage]) {
      for (let i = 0; i < this.listeners[EventMapName.onMessage].length; i++) {
        const iframe = this.listeners[EventMapName.onMessage][i];
        const isIn = this.msgTypeRegister[data.mt]?.some(app => app === iframe);
        if (isIn) {
          respond(
            iframe,
            JSON.stringify({
              eventName: EventMapName.onMessage,
              eventData: data
            })
          );
        }
      }
    }
  }

  private onMessage(event: MessageEvent) {
    if (event.data && isString(event.data)) {
      try {
        const obj = JSON.parse(event.data);
        obj.data = obj.data || {};
        const frame = this.getFrameTarget(event);
        const method = this[obj.method];
        if (method) {
          switch (method) {
            case MethodName.AddEventListener:
              this.AddEventListener(obj.data, frame);
              break;
            case MethodName.TriggerEvent:
              this.TriggerEvent(obj.data);
              break;
            case MethodName.CallbackEventData:
              this.CallbackEventData(obj.data, frame);
              break;
            case MethodName.RegisterWebsocket:
              this.RegisterWebsocket(obj.data, frame);
              break;
            case MethodName.SendMessage:
              this.SendMessage(obj.data, frame);
              break;
            case MethodName.ShowMessage:
              this.ShowMessage(obj.data, frame);
              break;
            case MethodName.UpdateNotificationCount:
              this.UpdateNotificationCount(obj.data, frame);
              break;
            case MethodName.SendWebSocketMsg:
              this.SendWebSocketMsg(obj.data, frame);
              break;
            case MethodName.HideTopup:
              this.HideTopup();
              break;
            case MethodName.ActivateApp:
              this.ActivateApp(obj.data);
              break;
            case MethodName.ShowAuth:
              this.ShowAuth();
              break;
            case MethodName.HideAuth:
              this.HideAuth();
              break;
            case MethodName.ShowAddMemberModal:
              this.ShowAddMemberModal();
              break;
            case MethodName.HideAddMemberModal:
              this.HideAddMemberModal();
              break;
            case MethodName.ShowCreateCredentialModal:
              this.ShowCreateCredentialModal(obj.data);
              break;
            case MethodName.HideSelectOrgModal:
              this.HideSelectOrgModal();
              break;
            case MethodName.GetCredentialsInfo:
              this.GetCredentialsInfo();
              break;
            case MethodName.ChangedNavigateRouter:
              this.ChangedNavigateRouter(obj.data, frame);
              break;
            case MethodName.UpdateTitle:
              this.UpdateTitle(obj.data, frame);
              break;

            default:
              this[obj.method](obj.data, frame);
              break;
          }
        } else {
        }
      } catch (_) {}
    }
  }

  ///////////////
  /**
   *  This service for iframe registering and call on onMessage method
   *
   */
  ////////////////

  private AddEventListener(data, iframe: HTMLIFrameElement) {
    this.registerListener(data.eventName, iframe);
  }

  ////////////////
  /**
   * Private method for other
   */
  ////////////////

  private registerListener(eventName: string, iframe: HTMLIFrameElement) {
    this.listeners[eventName] = this.listeners[eventName] || [];
    //Check to see if the wnd is already in the listener
    const isIn = this.listeners[eventName].some((app: any) => app === iframe);
    if (!isIn) {
      this.listeners[eventName].push(iframe);
    }
  }

  private CallbackEventData(data: CallbackEventData, iframe: HTMLIFrameElement) {
    try {
      if (iframe) {
        switch (data.eventName) {
          case EventMapName.onSession:
            const session = this.chatService.state.session;
            if (session) {
              this.fireEventAllRegisters(EventMapName.onSession, session, data.orgUuid);
            }
            break;
          case EventMapName.socketStatus:
            if (this.chatService.state.socketStatus) {
              this.fireEventAllRegisters(EventMapName.socketStatus, this.chatService.state.socketStatus, data.orgUuid);
            }
            break;

          default:
            break;
        }
      } else {
        console.log(`GetSocketStaus event with No Iframe`);
      }
    } catch (error) {
      console.error(error);
    }
  }

  private fireEvent(
    eventName: EventMapName,
    eventObj: EventMapFireData[EventMapName],
    targetOrgUuid: string,
    targetView?: string
  ) {
    const data = {
      eventName: eventName,
      eventData: eventObj
    };
    this.triggerEventWithOrgUuid(data, targetOrgUuid, targetView);
  }

  private triggerEventWithOrgUuid(data, orgUuid: string, targetView?: string) {
    const respond = (iframe, msg) => {
      let result: boolean;
      if (iframe && !!msg) {
        const application = this.appQuery.getEntity(iframe.id);
        //Only send messages to frames in the same account view
        if (!orgUuid || (application && application.orgUuid === orgUuid)) {
          if ((!targetView || targetView === application.portalAppPath) && iframe.contentWindow) {
            iframe.contentWindow.postMessage(msg, '*');
            result = true;
          }
        }
      }

      return result;
    };

    if (this.listeners[data.eventName]) {
      for (let i = 0; i < this.listeners[data.eventName].length; i++) {
        respond(this.listeners[data.eventName][i], JSON.stringify(data));
      }
    }
  }

  private getFrameTarget(e: MessageEvent): HTMLIFrameElement {
    let frame = null;
    try {
      const frames = document.getElementsByTagName('iframe'),
        framesLength = frames.length;
      let frameId = 0;
      for (; frameId < framesLength; frameId++) {
        if (frames[frameId].contentWindow === e.source) {
          frame = frames[frameId];
          break;
        }
      }
    } catch (error) {}
    return frame;
  }

  // methods below will be used internnaly when receive message from child iframes or post message to child iframes
  private ActivateApp(data: ActivateAppData) {
    try {
      const orgUuid = data.orgUuid || this.sessionQuery.currentOrg.orgUuid;
      let application = this.appQuery.getApplicationbyId(orgUuid, data.appId); // app id will be org & portalFragment path
      if (application == null) {
        application = this.appQuery.getByOrgUuidAndAppId(orgUuid, data.appId);
      }
      if (application) {
        this.router.navigate([application.portalFragment]);
      }
    } catch (error) {}
  }

  private TriggerEvent(data: TriggerEventData) {
    this.triggerEventWithOrgUuid(data, data?.orgUuid);
    // if (data.eventName == 'inviteNewMember' || data.eventName == 'viewPendingInvite') {
    //   this.routerService.changeViewFromInternal(
    //     new RouterModel(this.routerService.initModel.currentRouterModel.uuid, 'member')
    //   );
    // } else if (data.eventName == 'viewBillingInfo') {
    //   this.routerService.changeViewFromInternal(
    //     new RouterModel(this.routerService.initModel.currentRouterModel.uuid, 'organizationSettings')
    //   );
    // }
  }

  private UpdatedPayment(data, sourceFrame) {
    this.fireEvent(EventMapName.payment, {}, data.orgUuid);
  }

  private ShowMessage(data, sourceFrame) {
    // Only show a growl message is the sourceframe is the current frame displayed
    // if(this.activeFrame == sourceFrame) {
    if (data.type === 'success' || data.type === 'info') {
      this.toastService.success(data.message);
    } else {
      this.toastService.warning(data.message);
    }
    // }
  }

  private HideTopup() {}

  private ShowAuth() {
    this.sessionSerivce.checkSessionExpiry().subscribe();
  }

  private HideAuth() {
    // this.streamService.hideAuthModal();
  }

  private ShowAddMemberModal() {
    // let org = this.profileService.profile.getOrganizationByUuid(this.routerService.initModel.currentRouterModel.uuid);
    // if (org) {
    //   this.organizationStreamService.openAddMemberModal(org.orgUuid);
    // }
  }

  private HideAddMemberModal() {
    // this.organizationStreamService.hideAddMemberModal();
  }

  private HideSelectOrgModal() {}

  private ShowCreateCredentialModal(data) {
    // let org = this.profileService.profile.getOrganizationByUuid(this.routerService.initModel.currentRouterModel.uuid);
    // if (org) {
    //   this.organizationStreamService.openCreateCredentialModal(org.orgUuid, data.memberUuid);
    // }
  }

  private HideCreateCredentialModal() {
    // this.organizationStreamService.hideCreateCredentialModal();
  }

  private SendWebSocketMsg(data: string, iframe: HTMLIFrameElement) {
    //TODO need to verify org to be sent
    this.chatService.send(data);
  }

  private UpdateNotificationCount(data: UpdateNoticationData, iframe: HTMLIFrameElement) {
    try {
      if (iframe) {
        this.appService.updateNotificationCount(iframe.id, data.notification);
      } else {
      }
    } catch (error) {}
  }

  private GetCredentialsInfo() {
    this.fireEventAllRegisters(
      EventMapName.getCredentialsInfo,
      { orgUuid: this.sessionQuery.currentOrg.orgUuid },
      this.sessionQuery.currentOrg.orgUuid
    );
  }

  private ChangedNavigateRouter(data: ChangedNavigateRouterData, iframe: HTMLIFrameElement) {
    try {
      if (data?.path != null && iframe) {
        this.appQuery
          .selectEntity(iframe.id)
          .pipe(
            filter(x => x != null),
            take(1)
          )
          .subscribe(application => {
            const activeAppId = this.appQuery.getActiveId();
            if (activeAppId === iframe.id) {
              if (data?.path?.trim() === '') {
                this.appService.updateApplication(application.orgUuid + '_' + application.portalAppPath, {
                  lastNavigate: null
                });
                this.router.navigate([application.orgUuid, application.portalAppPath]);
              } else {
                const arr = data.path.split('/');
                this.appService.updateApplication(application.orgUuid + '_' + application.portalAppPath, {
                  lastNavigate: data?.path?.trim()
                });
                this.router.navigate([application.orgUuid, application.portalAppPath, ...arr]);
              }
            }
          });
      }
    } catch (error) {
      console.log('error: ', error);
    }
  }

  private UpdateTitle(data: UpdateTitleData, iframe: HTMLIFrameElement) {
    try {
      if (!!data?.title?.trim() && iframe) {
        this.appQuery
          .selectEntity(iframe.id)
          .pipe(
            filter(x => x != null),
            take(1)
          )
          .subscribe(application => {
            const activeAppId = this.appQuery.getActiveId();
            if (activeAppId === iframe.id) {
              const dataTitle = [];
              if (this.sessionQuery.currentOrg?.orgShortName) {
                dataTitle.push(this.sessionQuery.currentOrg?.orgShortName);
              }
              dataTitle.push(application.name, data.title?.trim());
              setTimeout(() => {
                this.title.setTitle(dataTitle.join(' | '));
              });
            }
          });
      }
    } catch (error) {
      console.log('error: ', error);
    }
  }

  private RegisterWebsocket(data: RegisterWebSocket, iframe: HTMLIFrameElement) {
    try {
      if (iframe) {
        data.mt?.forEach(mt => {
          this.msgTypeRegister[mt] = this.listeners[mt] || [];
          const isIn = this.msgTypeRegister[mt].some((app: any) => app === iframe);
          if (!isIn) {
            this.msgTypeRegister[mt].push(iframe);
          }
        });
        console.log('🚀 ~ this.msgTypeRegister', this.msgTypeRegister);

        if (this.msgTopics[data.orgUuid]) {
          this.msgTopics[data.orgUuid] = [...this.msgTopics[data.orgUuid], ...data.topics];
        } else {
          this.msgTopics[data.orgUuid] = data.topics || [];
        }
        console.log('🚀 ~ this.msgTopics', this.msgTopics);

        // handle subscribe topic
        this.chatService.socketStatus$
          .pipe(
            filter(status => status === SocketStatus.opened),
            take(1)
          )
          .subscribe(() => {
            const topic = [...new Set(this.msgTopics[data.orgUuid])];
            if (topic.length > 0) {
              this.chatService.subscribeTopic(topic).subscribe();
            }
          });
      } else {
        console.log(`RegisterWebsocket event with No Iframe`);
      }
    } catch (error) {
      console.error(error);
    }
  }

  private SendMessage(data: SendMessageEventData, iframe: HTMLIFrameElement) {
    try {
      if (iframe) {
        if (data?.message) {
          this.chatService.send(data.message);
        }
      } else {
        console.log(`SendMessage event with No Iframe`);
      }
    } catch (error) {
      console.error(error);
    }
  }
}
