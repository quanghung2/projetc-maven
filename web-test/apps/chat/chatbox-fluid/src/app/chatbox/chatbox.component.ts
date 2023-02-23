import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  ExternalOAuthQuery,
  GeoQuery,
  MetadataTxnWidget,
  Profile,
  ProfileQuery,
  ProfileService
} from '@b3networks/api/auth';
import { CustomerChatBox, CustomersQuery, CustomersService, ResponseTxn, UIConfig } from '@b3networks/api/callcenter';
import { ContactEmail } from '@b3networks/api/contact';
import { ChatBotService, ReqIndividualMetting } from '@b3networks/api/integration';
import {
  ChatMessage,
  ChatService,
  ChatSession,
  ConversationGroup,
  ConversationGroupQuery,
  ConversationGroupService,
  ConversationType,
  ConvoType,
  CustomerInfo,
  GroupType,
  MessageBody,
  MsgType,
  PreChatSurvey,
  ResquestTokenCustomer,
  SocketStatus,
  Status,
  SystemMsgType,
  UserType
} from '@b3networks/api/workspace';
import {
  DestroySubscriberComponent,
  detectBrowser,
  detectMobile,
  getCountryTimeZoneLocal,
  getDeviceSystem,
  LocalStorageUtil,
  X
} from '@b3networks/shared/common';
import { format } from 'date-fns-tz';
import { Observable } from 'rxjs';
import { filter, finalize, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { MessageReceiveProcessor } from '../service/message-receive.processor';
import { environment } from './../../environments/environment';
import { InformationCustomer } from './form-information/form-information.component';

@Component({
  selector: 'b3n-chatbox',
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.scss']
})
export class ChatBoxComponent extends DestroySubscriberComponent implements OnInit {
  loadingProfile = true;
  isError: boolean;
  isSecondOpenSocket: boolean;
  loading: boolean;
  // viewChat: boolean;
  hasChatBox: boolean;
  animation: boolean;
  enableIndividualMetting: boolean;

  customerInfo: CustomerChatBox;
  profileAgent: Profile;
  ui$: Observable<UIConfig>;
  liveChat$: Observable<ConversationGroup>;
  onmessage$: Observable<ChatMessage>;
  onmessageFlow$: Observable<ChatMessage>;

  viewing: Viewing = Viewing.profile;
  isMobile: boolean;

  private _convoIdChatbot: string;

  readonly Viewing = Viewing;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private activatedRoute: ActivatedRoute,
    private profileService: ProfileService,
    private profileQuery: ProfileQuery,
    private customersQuery: CustomersQuery,
    private customersService: CustomersService,
    private messageProcessor: MessageReceiveProcessor,
    private convoGroupService: ConversationGroupService,
    private convoGroupQuery: ConversationGroupQuery,
    private chatService: ChatService,
    private chatbotService: ChatBotService,
    private geoQuery: GeoQuery,
    private externalOAuthQuery: ExternalOAuthQuery
  ) {
    super();
    this.trackingWidgetDevice();
  }

  ngOnInit(): void {
    const encUrl = this.activatedRoute?.snapshot?.params?.encUrl;
    if (encUrl) {
      let domain = location.origin;
      if (domain.indexOf('localhost') > -1) {
        domain = 'https://u.b3.works';
      }

      domain += '/' + encUrl;
      this.profileService
        .resolveProfile(btoa(domain))
        .pipe(finalize(() => (this.loadingProfile = false)))
        .subscribe(
          profile => {
            document.title = profile?.oname || 'Chat Widget';
            this.profileAgent = profile;

            X.orgUuid = profile.oid;
            this.initChatApp();
          },
          err => (this.isError = true)
        );
    }
  }

  nextView() {
    this.viewing = Viewing.form;
  }

  createCustomer(event: InformationCustomer) {
    if (this.loading) {
      return;
    }

    const reqInit = <ResquestTokenCustomer>{
      displayName: event.name?.trim(),
      email: event.email?.trim(),
      orgUuid: X.orgUuid
    };

    this.loading = true;
    this.chatService
      .initPublicChat(reqInit, this.externalOAuthQuery.getTokenSocial())
      .pipe(tap(_ => {}))
      .subscribe(
        _ => {
          const infoCustomer = <CustomerChatBox>{
            identityUuid: null,
            orgUuid: reqInit.orgUuid,
            displayName: reqInit.displayName,
            emails: [
              <ContactEmail>{
                email: reqInit.email
              }
            ],
            chatCustomerId: this.chatService.session?.id
          };
          this.customerInfo = infoCustomer;

          this.chatService.socketStatus$
            .pipe(
              filter(x => x != null && x === SocketStatus.opened),
              takeUntil(this.destroySubscriber$),
              take(1)
            )
            .subscribe(__ => {
              this.startConvo();
            });
        },
        err => {
          // this.viewChat = false;
          this.loading = false;
        }
      );
  }

  startConvo() {
    this.loading = true;
    const ui = this.customersQuery.getUi;
    const geo = this.geoQuery.geo || {};
    let domainCusotmer: string;
    const metadata = <MetadataTxnWidget>{
      ...geo,
      currentVisit: ui.domain,
      title: ui.titleDomain,
      device: getDeviceSystem(),
      browser: detectBrowser()
    };
    delete metadata?.prefix;
    delete metadata?.isDefault;
    if (ui?.domain) {
      domainCusotmer = new URL(ui.domain)?.hostname;
    }
    // delete undefined property
    Object.keys(metadata).forEach(key => (metadata[key] === undefined ? delete metadata[key] : {}));

    let domain;
    try {
      domain = domainCusotmer
        ? domainCusotmer
        : window.parent.location.hostname.indexOf('localhost') > -1
        ? environment.portalDomain
        : window.parent.location.hostname;
    } catch (err) {
      domain = environment.portalDomain;
    }

    this.profileQuery.profile$
      .pipe(
        filter(profile => profile != null),
        take(1)
      )
      .subscribe(profile => {
        this.chatbotService.checkIndividualSkill(this.customerInfo.orgUuid, profile.iid).subscribe(
          enableIndividualMetting => {
            this.enableIndividualMetting = enableIndividualMetting;
            if (this.enableIndividualMetting) {
              this.chatbotService
                .startIndividualMeeting(<ReqIndividualMetting>{
                  org_uuid: this.customerInfo.orgUuid,
                  identity_uuid: profile.iid,
                  chat_customer_id: this.customerInfo.chatCustomerId,
                  name: this.customerInfo.displayName,
                  email: this.customerInfo.emails[0].email,
                  timezone: getCountryTimeZoneLocal() || format(new Date(), 'OOOO'),
                  language: 'en'
                })
                .subscribe(
                  res => {
                    this.hasChatBox = true;
                    if (res.convo_id) {
                      this._convoIdChatbot = res.convo_id;
                      LocalStorageUtil.setItem(`customerChatbot_${X.orgUuid}`, <LocalStorageLiveChat>{
                        name: this.customerInfo.displayName,
                        email: this.customerInfo.emails[0]?.email || ''
                      });

                      this.createConversation(res.convo_id, this.customerInfo);
                      // add customer to store
                      this.customersService.updateCustomersInfo(this.customerInfo);
                      // reset UI config for chatbox
                      this.customersService.resetUIState();
                      this.convoGroupService.setActive(res.convo_id);
                    }
                    // this.viewChat = true;
                    this.viewing = Viewing.chat;
                    this.loading = false;
                  },
                  err => {
                    // this.viewChat = false;
                    this.loading = false;
                  }
                );
            }
          },
          err => {
            // this.viewChat = false;
            this.loading = false;
          }
        );
      });
  }

  private initChatApp() {
    this.ui$ = this.customersQuery.ui$;
    this.liveChat$ = this.convoGroupQuery.selectActive().pipe(
      takeUntil(this.destroySubscriber$),
      filter(x => x != null)
    );

    this.onmessage$ = this.chatService.onmessage().pipe(
      tap(message => {
        try {
          this.messageProcessor.process(message);

          if (this._convoIdChatbot && message.convo === this._convoIdChatbot) {
            if (message.ct === ConvoType.customer) {
              if (message.mt === MsgType.transfer) {
                const resTxn = <ResponseTxn>message.body.data;
                if (!!resTxn.chatSession) {
                  this.chatService.normalClose();
                  let session: ChatSession;
                  if (resTxn.chatSession) {
                    session = new ChatSession({
                      ...resTxn.chatSession,
                      chatUser: resTxn.chatSession.id,
                      ns: this.customerInfo.orgUuid
                    });
                    this.customerInfo.chatCustomerId = resTxn.chatSession.id;
                  }

                  // reset UI config for chatbox
                  this.customersService.resetUIState();

                  this.reInitChatWithAgent(
                    session,
                    resTxn.convoInfo.id,
                    resTxn.chatSession.id,
                    resTxn.token,
                    false,
                    () => {
                      this.hasChatBox = false;
                      this.animation = false;
                    }
                  );
                }
              } else if (message?.mt === MsgType.mcq) {
                this.customersService.updateUI(<UIConfig>{
                  waitingChatbot: false,
                  showFooter: false
                });
                this.animation = false;
                const answers = message?.body?.data;
                if (answers) {
                  this.customersService.updateFlow(message?.body?.data);
                }
              } else if (message?.mt === MsgType.message && message.ut === UserType.System) {
                const customer = this.customersQuery.getValue()?.chatCustomerId;
                if (message.user !== customer) {
                  this.customersService.updateUI(<UIConfig>{
                    waitingChatbot: false,
                    showFooter: true
                  });
                  this.animation = true;
                  this.customersService.updateFlow([]);
                }
              } else if (message?.mt === MsgType.system) {
                if (message?.body?.data?.type === SystemMsgType.archived) {
                  this.animation = false;
                }
              }
            }
          }
        } catch (error) {}
      })
    );
  }

  private reInitChatWithAgent(
    session: ChatSession,
    convoId: string,
    chatCustomerId: string,
    tokenRefresh: string,
    isReuse: boolean,
    cb: (livechat: ConversationGroup) => void
  ) {
    this.chatService.initLiveChat(session, tokenRefresh).subscribe(__ => {
      setTimeout(() => {
        this.chatService.socketStatus$
          .pipe(
            filter(x => x === SocketStatus.opened),
            take(1),
            takeUntil(this.destroySubscriber$)
          )
          .subscribe(___ => {
            this.customerInfo.chatCustomerId = chatCustomerId || this.chatService.session?.id;
            // add customer to store
            this.customersService.updateCustomersInfo(this.customerInfo);
            if (!this.hasChatBox) {
              LocalStorageUtil.setItem(`tokenSession_${session.ns}`, this.chatService.state?.tokenLiveChatRecover);
              LocalStorageUtil.setItem(`customerChatbot_${X.orgUuid}`, <LocalStorageLiveChat>{
                name: this.customerInfo.displayName,
                email: this.customerInfo.emails[0]?.email || '',
                convoId: convoId,
                chatCustomerId: this.customerInfo.chatCustomerId,
                hasGoogle: !!this.externalOAuthQuery.getGoogle()
              });
            }
            const livechat = this.createConversation(convoId, this.customerInfo);
            if (!isReuse) {
              const msg = ChatMessage.createMessagePublic(
                livechat,
                new MessageBody({
                  data: <PreChatSurvey>{
                    name: this.customerInfo.displayName,
                    email: this.customerInfo.emails[0]?.email || ''
                  }
                }),
                this.customerInfo.chatCustomerId,
                MsgType.prechatsurvey
              );
              this.chatService.send(msg);
            }

            this.convoGroupService.setActive(convoId);
            // this.viewChat = true;
            this.viewing = Viewing.chat;
            this.loading = false;
            cb(livechat);
          });
      }, 10);
    });
  }

  private createConversation(txnUuid: string, info: CustomerChatBox) {
    const liveChat = new ConversationGroup(<Partial<ConversationGroup>>{
      conversationGroupId: txnUuid,
      conversations: [
        {
          conversationId: txnUuid,
          conversationType: ConversationType.public,
          members: []
        }
      ],
      customerInfo: <CustomerInfo>{
        uuid: info.uuid,
        name: info.displayName,
        email: info.emails[0].email
      },
      createdAt: new Date(),
      status: Status.opened,
      type: GroupType.Customer
    });

    this.convoGroupService.addConversation2Store(liveChat);
    return liveChat;
  }

  private trackingWidgetDevice() {
    let isInitView = true;
    this.breakpointObserver
      .observe(['(max-width: 1200px)'])
      .pipe(
        switchMap((state: BreakpointState) => {
          let isMobile = state?.matches;
          if (detectMobile()) {
            isMobile = true;
          }

          this.isMobile = isMobile;

          if (isInitView) {
            isInitView = false;
            this.viewing = isMobile ? Viewing.profile : Viewing.form;
          }

          this.customersService.updateUI(<UIConfig>{
            isMobile: isMobile
          });
          return this.breakpointObserver.observe([Breakpoints.HandsetLandscape]);
        }),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe((state: BreakpointState) => {
        this.customersService.updateUI(<UIConfig>{
          isLandscape: state?.matches
        });
      });
  }
}

export enum Viewing {
  profile = 'profile',
  form = 'form',
  chat = 'chat'
}

export interface LocalStorageLiveChat {
  name: string;
  email: string;
  convoId: string;
  chatCustomerId: string;
  hasGoogle: boolean;
}
