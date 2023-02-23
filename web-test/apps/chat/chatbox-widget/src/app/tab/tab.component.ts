import { Component, OnInit } from '@angular/core';
import { ExternalOAuthQuery, GeoQuery, MetadataTxnWidget } from '@b3networks/api/auth';
import {
  CustomerChatBox,
  CustomersQuery,
  CustomersService,
  ResponseTxn,
  ResquestCreateChatSession,
  ResquestCreateTxn,
  UIConfig
} from '@b3networks/api/callcenter';
import { ContactEmail, ContactNumber } from '@b3networks/api/contact';
import { ChatBotService, ReqIntelligenceGateway } from '@b3networks/api/integration';
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
  getCountryTimeZoneLocal,
  getDeviceSystem,
  LocalStorageUtil,
  X
} from '@b3networks/shared/common';
import { format } from 'date-fns-tz';
import { Observable } from 'rxjs';
import { filter, take, takeUntil, tap } from 'rxjs/operators';
import { environment } from './../../environments/environment';
import { MessageReceiveProcessor } from './../service/message-receive.processor';
import { InformationCustomer } from './form-information/form-information.component';

@Component({
  selector: 'b3n-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss']
})
export class TabComponent extends DestroySubscriberComponent implements OnInit {
  isSecondOpenSocket: boolean;
  loading: boolean;
  viewChat: boolean;
  hasChatBox: boolean;
  animation: boolean;

  customerInfo: CustomerChatBox;
  ui$: Observable<UIConfig>;
  liveChat$: Observable<ConversationGroup>;
  onmessage$: Observable<ChatMessage>;
  onmessageFlow$: Observable<ChatMessage>;

  errorPhoneNumber: string;
  errorEmail: string;

  private _convoIdChatbot: string;

  constructor(
    private customersService: CustomersService,
    private messageProcessor: MessageReceiveProcessor,
    private customersQuery: CustomersQuery,
    private convoGroupService: ConversationGroupService,
    private convoGroupQuery: ConversationGroupQuery,
    private chatService: ChatService,
    private chatbotService: ChatBotService,
    private geoQuery: GeoQuery,
    private externalOAuthQuery: ExternalOAuthQuery
  ) {
    super();
  }

  ngOnInit(): void {
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
                if (resTxn.chatSession) {
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

  toggleChatBox(isOpen: boolean) {
    const msgToParent = isOpen ? 'OPEN_CHAT_WIDGET' : 'CLOSE_CHAT_WIDGET';
    window.parent.postMessage(msgToParent, '*');

    setTimeout(() => {
      this.customersService.updateUI(<UIConfig>{
        isOpenChat: isOpen
      });
    });
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

    this.chatbotService
      .startChatbot(<ReqIntelligenceGateway>{
        org_uuid: this.customerInfo.orgUuid,
        timezone: getCountryTimeZoneLocal() || format(new Date(), 'OOOO'),
        chat_customer_id: this.chatService.session?.id,
        name: this.customerInfo.displayName,
        email: this.customerInfo.emails[0]?.email || '',
        domain: domain,
        queue_uuid: ui?.queueUuid,
        bot: ui?.botId,
        live_chat_id: ui?.livechatId,
        metadata: metadata
      })
      .subscribe(
        res => {
          this.hasChatBox = res.handledByBot;
          if (res.handledByBot) {
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
            this.viewChat = true;
            this.loading = false;
          } else {
            const store: LocalStorageLiveChat = LocalStorageUtil.getItem(`customerChatbot_${X.orgUuid}`);
            const hasGoogle = !!this.externalOAuthQuery.getGoogle();
            let api$;
            if (!ui.isInboxFlow) {
              const req = <ResquestCreateTxn>{
                orgUuid: this.customerInfo.orgUuid,
                name: this.customerInfo.displayName,
                email: this.customerInfo.emails[0]?.email || '',
                // check change user to reuse old convo
                convoId:
                  !!this.customerInfo.emails[0]?.email &&
                  store?.email === this.customerInfo.emails[0].email &&
                  hasGoogle === store.hasGoogle
                    ? store?.convoId
                    : null, // because email changed
                dest: domain,
                queueUuid: ui?.queueUuid,
                livechatId: ui?.livechatId,
                metadata: metadata
              };
              api$ = this.customersService.createTxn(req);
            } else {
              const req = <ResquestCreateChatSession>{
                orgUuid: this.customerInfo.orgUuid,
                name: this.customerInfo.displayName,
                email: this.customerInfo.emails[0]?.email || '',
                number: this.customerInfo?.numbers?.[0]?.number,
                // check change user to reuse old convo
                convoId:
                  !!this.customerInfo.emails[0]?.email &&
                  store?.email === this.customerInfo.emails[0].email &&
                  hasGoogle === store.hasGoogle
                    ? store?.convoId
                    : null, // because email changed
                widgetUuid: ui?.widgetUuid,
                metadata: metadata
              };
              api$ = this.customersService.createTxnV2(req);
            }

            api$.subscribe(
              resTxn => {
                this.chatService.normalClose();
                let session: ChatSession;
                if (resTxn.chatSession) {
                  session = new ChatSession({
                    ...resTxn.chatSession,
                    chatUser: resTxn.chatSession.id,
                    ns: this.customerInfo.orgUuid
                  });
                  this.customerInfo.chatCustomerId = resTxn.chatSession.id;
                } else {
                  session = new ChatSession({
                    ...this.chatService.session,
                    chatUser: store?.chatCustomerId,
                    ns: this.customerInfo.orgUuid
                  });
                }

                // reset UI config for chatbox
                this.customersService.resetUIState();

                this.reInitChatWithAgent(
                  session,
                  resTxn.convoInfo.id,
                  resTxn?.chatSession?.id,
                  resTxn?.token,
                  !resTxn.chatSession,
                  () => {}
                );
              },
              err => {
                if (err?.code === 'inbox.invalidNumberFormat') {
                  this.errorPhoneNumber = err?.message;
                }

                this.viewChat = false;
                this.loading = false;
              }
            );
          }
        },
        err => {
          this.viewChat = false;
          this.loading = false;
        }
      );
  }

  createCustomer(event: InformationCustomer) {
    if (this.loading) {
      return;
    }

    this.errorEmail = '';
    this.errorPhoneNumber = '';

    const ui = this.customersQuery.getUi;
    const reqInit = <ResquestTokenCustomer>{
      displayName: event.name?.trim(),
      name: event.name?.trim(),
      email: event.email?.trim(),
      orgUuid: X.orgUuid,
      isInboxFlow: ui.isInboxFlow
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
            numbers: event?.number
              ? [
                  <ContactNumber>{
                    number: event.number
                  }
                ]
              : [],
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
          if (err?.code === 'inbox.invalidEmail') {
            this.errorEmail = err?.message;
          }
          this.viewChat = false;
          this.loading = false;
        }
      );
  }

  private reInitChatWithAgent(
    session: ChatSession,
    convoId: string,
    chatCustomerId: string,
    tokenRefresh: string,
    isReuse: boolean,
    cb: () => void
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
                number: this.customerInfo?.numbers?.[0]?.number || '',
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
                    email: this.customerInfo.emails[0]?.email || '',
                    number: this.customerInfo?.numbers?.[0]?.number
                  }
                }),
                this.customerInfo.chatCustomerId,
                MsgType.prechatsurvey
              );
              this.chatService.send(msg);
            }

            this.convoGroupService.setActive(convoId);
            this.viewChat = true;
            this.loading = false;
            cb();
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
        email: info.emails[0].email,
        number: info?.numbers?.[0]?.number
      },
      createdAt: new Date(),
      status: Status.opened,
      type: GroupType.Customer
    });

    this.convoGroupService.addConversation2Store(liveChat);
    return liveChat;
  }
}

export interface LocalStorageLiveChat {
  name: string;
  email: string;
  number: string;
  convoId: string;
  chatCustomerId: string;
  hasGoogle: boolean;
}
