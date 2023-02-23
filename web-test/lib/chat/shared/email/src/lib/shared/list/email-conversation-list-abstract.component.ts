import { Component, Input, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { FileService } from '@b3networks/api/file';
import {
  ChatMessage,
  ChatService,
  ConversationGroup,
  ConversationGroupQuery,
  ConversationGroupReq,
  ConversationGroupService,
  EmailIntegrationQuery,
  EmailIntegrationService,
  EmailSchedule,
  HistoryMessageService,
  MeQuery,
  MessageBody,
  MsgType,
  Status,
  SystemMessageData,
  SystemMsgType,
  User,
  UserQuery
} from '@b3networks/api/workspace';
import { AppQuery, MessageConstants, ModeSidebar } from '@b3networks/chat/shared/core';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AssignMultipleMemberDialog } from '../assign-multiple-member/assign-multiple-member.component';

@Component({
  selector: 'b3n-email-conversation-list-abstract',

  template: ''
})
export abstract class EmailConversationListAbstractComponent implements OnInit, OnDestroy {
  @Input() customHeaderTemplate: TemplateRef<any>;
  @Input() customDisplayConvoTemplate: TemplateRef<any>;
  @Input() loadMoreTemplate: TemplateRef<any>;
  @Input() hideMenuIcon: boolean;
  conversation$: Observable<ConversationGroup[]>;

  selectedConversationGroup: ConversationGroup = new ConversationGroup();
  checkedConversationGroups: ConversationGroup[] = [];
  conversations: ConversationGroup[] = [];

  showAction = false;

  users: User[] = [];
  me: User;

  isOverModeLeftSidebar$: Observable<boolean>;

  private ngUnsubscribe: Subscription = new Subscription();
  private activeConvoUnsubscribe: Subscription = new Subscription();
  protected isDraft = false;

  constructor(
    protected meQuery: MeQuery,
    protected historyMessageService: HistoryMessageService,
    protected conversationGroupQuery: ConversationGroupQuery,
    protected userQuery: UserQuery,
    protected conversationGroupService: ConversationGroupService,
    protected dialog: MatDialog,
    protected toastService: ToastService,
    protected chatService: ChatService,
    protected emailIntegrationService: EmailIntegrationService,
    protected emailIntegrationQuery: EmailIntegrationQuery,
    protected activatedRoute: ActivatedRoute,
    protected fileService: FileService,
    private appQuery: AppQuery
  ) {}

  ngOnInit() {
    this.userQuery.users$.subscribe(users => (this.users = users));
    this.meQuery.me$.subscribe(me => (this.me = me));
    this.getConversations();
    this.activeConvoUnsubscribe = this.conversationGroupQuery
      .selectActive()
      .pipe(filter(activeConvo => !!activeConvo && activeConvo.id !== this.selectedConversationGroup.id))
      .subscribe(activeConversationGroup => {
        this.selectedConversationGroup = activeConversationGroup;
      });
    this.isOverModeLeftSidebar$ = this.appQuery.modeLeftSidebar$.pipe(map(mode => mode === ModeSidebar.over));

    this.init();
  }

  ngOnDestroy() {
    this.removeActiveConversationGroup();
    this.ngUnsubscribe.unsubscribe();
    this.activeConvoUnsubscribe.unsubscribe();
  }

  protected init() {
    // implement ngOnInit;
  }

  protected removeActiveConversationGroup() {
    if (this.selectedConversationGroup.id) {
      this.conversationGroupService.removeActive(this.selectedConversationGroup.id);
    }
  }

  abstract getConversations(): void;

  trachByConvo(i, item: ConversationGroup) {
    return item?.conversationGroupId;
  }

  onSelectConvo(conversationGroup: ConversationGroup) {
    this.markAsSeen(conversationGroup);
    if (this.isDraft && conversationGroup.isEmailConversationHasDraft(this.me.identityUuid)) {
      this.selectedConversationGroup = conversationGroup;
      this.openDraftEmail(conversationGroup);
    } else {
      this.conversationGroupService.setActive(conversationGroup.id);
    }
  }

  protected openDraftEmail(conversationGroup: ConversationGroup) {
    console.error('Method not implemented');
  }

  onCheckConvo($event: { checked: boolean; checkedConvo: ConversationGroup }) {
    const checkedConvo = $event.checkedConvo;
    if ($event.checked) {
      this.checkedConversationGroups.push(checkedConvo);
    } else {
      const index = this.checkedConversationGroups.findIndex(convoGroup => convoGroup.id === checkedConvo.id);
      this.checkedConversationGroups.splice(index, 1);
    }
  }

  assignMembers() {
    this.dialog.open(AssignMultipleMemberDialog, {
      width: '600px',
      data: this.checkedConversationGroups
    });
  }

  deleteConvo() {
    const observable = [];
    const archivedReq = new ConversationGroupReq();
    archivedReq.status = Status.archived;
    this.checkedConversationGroups.forEach(convoGroup => {
      observable.push(this.conversationGroupService.updateGroupConversation(convoGroup.id, archivedReq));
    });

    forkJoin(observable).subscribe(
      () => {
        this.checkedConversationGroups.forEach(convoGroup => {
          const messageBody: MessageBody = new MessageBody({
            text: MessageConstants.ARCHIVED_CUSTOMER_CONVERSATION(this.me.displayName),
            data: <SystemMessageData>{
              type: SystemMsgType.archived
            }
          });

          const message = ChatMessage.createEmailMessage(
            convoGroup,
            new MessageBody(messageBody),
            this.me.userUuid,
            MsgType.system
          );

          this.chatService.send(message);
        });
        this.checkedConversationGroups = [];
        this.removeActiveConversationGroup();
      },
      err => {
        this.toastService.error(err.message);
      }
    );
  }

  toggleShowAction() {
    this.showAction = !this.showAction;
    if (!this.showAction) {
      this.checkedConversationGroups = [];
    }
  }

  onSelectMessage(convoId: string, msg?: ChatMessage | EmailSchedule) {
    const convos = this.conversationGroupQuery.getConvosByChildId(convoId);
    // console.log(msg);
    if (convos && convos.length) {
      this.selectedConversationGroup = convos[0];
      this.conversationGroupService.setActive(this.selectedConversationGroup.id);
    } else {
      this.conversationGroupService.getConversationDetail(convoId, this.me.identityUuid, true).subscribe(convo => {
        this.selectedConversationGroup = convo;
        this.conversationGroupService.setActive(this.selectedConversationGroup.id);
      });
    }
  }

  private markAsSeen(conversation: ConversationGroup) {
    if (conversation.mentionCount && conversation.unreadCount) {
      const message = ChatMessage.createEmailSeenMessage(conversation);
      this.chatService.send(message);
    }
  }
}
