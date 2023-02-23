import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { Router } from '@angular/router';
import {
  ChatMessage,
  ChatService,
  ConversationGroup,
  ConversationGroupQuery,
  ConversationGroupReq,
  ConversationGroupService,
  ConversationGroupUI,
  EmailConversationTag,
  EmailInbox,
  EmailIntegrationQuery,
  EmailIntegrationService,
  EmailTag,
  FilterConvoMessageReq,
  HistoryMessageQuery,
  HistoryMessageService,
  JoinLeaveFollowedData,
  Member,
  MessageBody,
  MoveEmailConversation,
  MsgType,
  RoleType,
  SnoozeEmailConversation,
  Status,
  SystemMessageData,
  SystemMsgType,
  User,
  UserQuery
} from '@b3networks/api/workspace';
import {
  LeaveConvoComponent,
  MessageConstants,
  UploadDialogComponent,
  UploadDialogInput
} from '@b3networks/chat/shared/core';
import { renderLinkForCopy } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ClipboardService } from 'ngx-clipboard';
import { forkJoin, Observable, Subject } from 'rxjs';
import { filter, map, take, takeUntil } from 'rxjs/operators';
import {
  ArchiveConversationComponent,
  ArchiveConversationData
} from '../dialog/archive-conversation/archive-conversation.component';
import { AssignMemberDialog } from '../dialog/assign-member/assign-member.component';
import { CreateTagComponent } from '../dialog/create-tag/create-tag.component';
import { MoveEmailToInboxDialog } from '../dialog/move-email/move-email-inbox.component';

@UntilDestroy()
@Component({
  selector: 'b3n-email-conversation-detail',
  templateUrl: './email-conversation-detail.component.html',
  styleUrls: ['./email-conversation-detail.component.scss']
})
export class EmailConversationDetailComponent implements OnInit, OnDestroy {
  readonly MsgType = MsgType;

  private _destroyConvo$ = new Subject();

  historyMessagesObservable$: Observable<ChatMessage[]>;
  messages: ChatMessage[] = [];
  @Input() isSearch = false;
  @Input() users: User[] = [];
  @Input() me: User = new User();
  @Output() reloadConvo: EventEmitter<boolean> = new EventEmitter<boolean>();

  editingMessageId: string;
  conversationGroup: ConversationGroup = new ConversationGroup();
  allInboxes: EmailInbox[] = [];
  conversationInbox: EmailInbox;
  allTags: EmailTag[] = [];
  conversationTags: EmailTag[] = [];

  @ViewChild('viewport', { static: false }) viewport: ElementRef | null;

  showCustomSnooze: boolean;

  @ViewChild('snoozeMenuTrigger', { static: false }) trigger: MatMenuTrigger;
  minDate = new Date();
  snoozeForm = new UntypedFormGroup({
    datetime: new UntypedFormControl()
  });
  isFollowed: boolean;

  @Input() set convoFromSearchHistory(convo: ConversationGroup) {
    if (convo && convo.id) {
      this.conversationGroup = convo;
      this.updateInternalInfo();
      this.historyMessagesObservable$ = this.historyMessageQuery
        .selectAllByConversation(this.conversationGroup.publicConversationId)
        .pipe(untilDestroyed(this));
      this.getHistoryMessage();
    }
  }

  constructor(
    public elr: ElementRef,
    private dialog: MatDialog,
    private emailIntegrationService: EmailIntegrationService,
    private toastService: ToastService,
    private conversationGroupService: ConversationGroupService,
    private conversationGroupQuery: ConversationGroupQuery,
    private chatService: ChatService,
    private historyMessageService: HistoryMessageService,
    private historyMessageQuery: HistoryMessageQuery,
    private changeDetectionRef: ChangeDetectorRef,
    private userQuery: UserQuery,
    private emailIntegrationQuery: EmailIntegrationQuery,
    private router: Router,
    private clipboardService: ClipboardService,
    private cdr: ChangeDetectorRef
  ) {
    this.minDate.setDate(new Date().getDate() - 1);
  }

  ngOnInit(): void {
    this.conversationGroupQuery
      .selectActive()
      .pipe(untilDestroyed(this))
      .subscribe(activeConversationGroup => {
        if (activeConversationGroup) {
          this.conversationGroup = activeConversationGroup;
          this.updateInternalInfo();
          this.getHistoryMessage();
        } else {
          this.conversationGroup = new ConversationGroup();
        }
      });

    this.conversationGroupQuery
      .selectActiveId()
      .pipe(
        filter(id => !!id),
        untilDestroyed(this)
      )
      .subscribe(_ => {
        this.historyMessageQuery
          .selectAllByConversation(this.conversationGroup.publicConversationId)
          .pipe(untilDestroyed(this))
          .subscribe(msgs => {
            this.messages = msgs;
            this.cdr.detectChanges();
          });

        this._destroyConvo$.next(true);
        this.conversationGroupQuery
          .selectUIState(this.conversationGroup.id, 'editingMessageId')
          .pipe(takeUntil(this._destroyConvo$))
          .subscribe(id => (this.editingMessageId = id));
      });
  }

  ngOnDestroy() {
    this._destroyConvo$.next(true);
    this._destroyConvo$.unsubscribe();
  }

  copyLink() {
    this.clipboardService.copyFromContent(
      renderLinkForCopy(this.router) + `&convoChildId=${this.conversationGroup.publicConversationId}`
    );
    this.toastService.success('Copy link successfully!');
  }

  private updateInternalInfo() {
    this.updateInboxInfo(this.conversationGroup.emailInboxUuid);
    this.fetchTags();
    this.isFollowed = this.conversationGroup.isFollowingConversationByMe;
  }

  private fetchTags() {
    forkJoin([
      this.emailIntegrationQuery.tags$.pipe(
        filter(tags => !!tags.length),
        take(1)
      ),
      this.emailIntegrationService.getConversationTags(this.conversationGroup.id)
    ])
      .pipe(untilDestroyed(this))
      .subscribe(([allTags, conversationTags]) => {
        this.conversationTags = [];
        this.allTags = allTags;
        this.allTags.forEach(tag => {
          const index = conversationTags.findIndex(conversationTag => conversationTag.tagId === tag.id);
          if (index >= 0) this.conversationTags.push(tag);
        });
        this.changeDetectionRef.detectChanges();
      });
  }

  follow() {
    const member: Partial<Member> = {
      role: RoleType.followed,
      identityUuid: this.me.identityUuid
    };

    this.conversationGroupService.addMembers(this.conversationGroup.id, [member]).subscribe(
      () => {
        this.isFollowed = !this.isFollowed;
        const messageBody: MessageBody = new MessageBody({
          data: <SystemMessageData>{
            type: SystemMsgType.followed,
            data: new JoinLeaveFollowedData({
              followed: [this.me.userUuid]
            })
          }
        });
        this.sendMessage(messageBody, true);
        this.removeActiveConversationGroup();
      },
      error => {
        this.showError(error);
      }
    );
  }

  unfollow() {
    this.conversationGroupService.deleteMembers(this.conversationGroup.id, [this.me.identityUuid]).subscribe(
      () => {
        this.isFollowed = !this.isFollowed;
        const messageBody: MessageBody = new MessageBody({
          data: <SystemMessageData>{
            type: SystemMsgType.leave,
            data: new JoinLeaveFollowedData({
              leave: [this.me.userUuid]
            })
          }
        });
        this.sendMessage(messageBody, true);
        this.removeActiveConversationGroup();
      },
      error => {
        this.showError(error);
      }
    );
  }

  isSnooze() {
    return this.conversationGroup.snoozeBy && this.conversationGroup.snoozeFrom;
  }

  snooze(e: MouseEvent, selectedSnoozeTime: string) {
    if (selectedSnoozeTime) {
      const date = new Date();
      if (selectedSnoozeTime === '1h') {
        date.setHours(date.getHours() + 1);
      } else if (selectedSnoozeTime === '2h') {
        date.setHours(date.getHours() + 2);
      } else if (selectedSnoozeTime === '4h') {
        date.setHours(date.getHours() + 4);
      } else if (selectedSnoozeTime === '1d') {
        date.setDate(date.getDate() + 1);
      } else if (selectedSnoozeTime === '2d') {
        date.setDate(date.getDate() + 2);
      } else if (selectedSnoozeTime === '1w') {
        date.setDate(date.getDate() + 7);
      }
      const snoozeTime = Math.round(date.getTime() / 1000);
      if (snoozeTime) {
        this.conversationGroupService.snoozeConversationGroup(this.conversationGroup.id, snoozeTime).subscribe(() => {
          this.sendSnoozeMessage(snoozeTime, new Date().toLocaleString());
          this.removeActiveConversationGroup();
        });
      }
    } else {
      e.stopPropagation();
      this.showCustomSnooze = true;
    }
  }

  datesUpdated() {
    if (!this.snoozeForm.value) return;

    const date = new Date(this.snoozeForm.value.datetime);
    const snoozeForm = Math.round(date.getTime() / 1000);
    this.conversationGroupService.snoozeConversationGroup(this.conversationGroup.id, snoozeForm).subscribe(() => {
      this.sendSnoozeMessage(snoozeForm, new Date().toLocaleString());
      this.removeActiveConversationGroup();
      this.trigger.closeMenu();
    });
  }

  unSnooze() {
    this.conversationGroupService
      .deleteSnoozeConversation(this.conversationGroup.id)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.sendSnoozeMessage(null, null);
        this.removeActiveConversationGroup();
      });
  }

  private sendSnoozeMessage(snoozeFrom: number, snoozeAt: string) {
    const messageBody: MessageBody = new MessageBody({
      data: <SystemMessageData>{
        type: SystemMsgType.snooze,
        data: <SnoozeEmailConversation>{
          snoozeFrom: snoozeFrom,
          snoozeAt: snoozeAt
        }
      }
    });
    this.sendMessage(messageBody, true);
  }

  private removeActiveConversationGroup() {
    this.conversationGroupService.removeActive(this.conversationGroup.id);
  }

  createNewTag() {
    const dialogRef = this.dialog.open(CreateTagComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.fetchTags();
      }
    });
  }

  deleteTag(tag: EmailTag, index: number) {
    this.emailIntegrationService.deleteConversationTag(this.conversationGroup.id, tag.id).subscribe(
      () => {
        this.conversationTags.splice(index, 1);
        this.changeDetectionRef.detectChanges();
      },
      error => {
        this.showError(error);
      }
    );
  }

  selectTag(selectedTag: EmailTag) {
    const index = this.conversationTags.findIndex(tag => tag.id === selectedTag.id);
    if (index >= 0) return;

    const body: EmailConversationTag = {
      conversationGroupId: this.conversationGroup.id,
      tagId: selectedTag.id
    };
    this.emailIntegrationService.createConversationTag(body).subscribe(
      (newTag: EmailConversationTag) => {
        const newItem = this.allTags.find(tag => tag.id === newTag.tagId);
        this.conversationTags.push(newItem);
        this.changeDetectionRef.detectChanges();
      },
      error => {
        this.showError(error);
      }
    );
  }

  private showError(error) {
    this.toastService.error(error && error.message ? error.message : MessageConstants.DEFAULT);
  }

  moveToInbox() {
    const dialogRef = this.dialog.open(MoveEmailToInboxDialog, {
      width: '400px',
      data: this.conversationGroup
    });

    dialogRef.afterClosed().subscribe((data: MoveEmailConversation) => {
      if (data) {
        const messageBody: MessageBody = new MessageBody({
          data: <SystemMessageData>{
            type: SystemMsgType.move,
            data: data
          }
        });
        this.sendMessage(messageBody, true);
      }
    });
  }

  assign() {
    const dialogRef = this.dialog.open(AssignMemberDialog, {
      width: '600px',
      data: this.conversationGroup
    });

    dialogRef.afterClosed().subscribe((memberIds: string[]) => {
      if (memberIds && memberIds.length) {
        this.assignMembers(memberIds);
      }
    });
  }

  private assignMembers(identityIds: string[]) {
    const chatUserUuids = this.userQuery.getAllUserByIdentityIds(identityIds).map(user => user.userUuid);
    const memberNames = this.users.filter(user => identityIds.includes(user.uuid)).map(user => user.displayName);

    const members: Partial<Member>[] = identityIds.map(id => ({
      role: RoleType.member,
      identityUuid: id
    }));

    this.conversationGroupService.addMembers(this.conversationGroup.id, members).subscribe(
      () => {
        const messageBody: MessageBody = new MessageBody({
          text: MessageConstants.ASSIGN_CUSTOMER_CONVERSATION(this.me.displayName, memberNames.join(', ')),
          data: <SystemMessageData>{
            type: SystemMsgType.join,
            data: new JoinLeaveFollowedData({
              join: chatUserUuids
            })
          }
        });

        this.sendMessage(messageBody);
        this.removeActiveConversationGroup();
      },
      error => {
        this.showError(error);
      }
    );
  }

  isMemberOfConversation(): boolean {
    return this.me ? this.conversationGroup.isMemberOfConversation() : false;
  }

  leave() {
    const dialogRef = this.dialog.open(LeaveConvoComponent, {
      width: '600px',
      data: this.conversationGroup
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.leaveConversation();
      }
    });
  }

  private leaveConversation() {
    this.conversationGroupService.deleteMembers(this.conversationGroup.id, [this.me.identityUuid]).subscribe(_ => {
      const messageBody: MessageBody = new MessageBody({
        text: MessageConstants.LEAVE_CUSTOMER_CONVERSATION(this.me.displayName),
        data: <SystemMessageData>{
          type: SystemMsgType.leave,
          data: new JoinLeaveFollowedData({
            leave: [this.me.userUuid]
          })
        }
      });

      this.sendMessage(messageBody);
      this.removeActiveConversationGroup();
    });
  }

  archivedChannel() {
    const dialogRef = this.dialog.open(ArchiveConversationComponent, {
      width: '600px',
      data: <ArchiveConversationData>{
        text: 'archive',
        conversationGroup: this.conversationGroup
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.archived();
      }
    });
  }

  private archived() {
    const request = new ConversationGroupReq();
    request.status = Status.archived;
    this.updateConversationGroup(request);
  }

  unArchivedChannel() {
    const dialogRef = this.dialog.open(ArchiveConversationComponent, {
      width: '600px',
      data: <ArchiveConversationData>{
        text: 'reopen',
        conversationGroup: this.conversationGroup
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.unArchived();
      }
    });
  }

  private unArchived() {
    // @Todo
    // take 10s to effect, Cash optimize
    const request = new ConversationGroupReq();
    request.status = Status.opened;
    this.updateConversationGroup(request);
  }

  private updateConversationGroup(request: ConversationGroupReq) {
    let message, type: string;
    if (request.status === Status.archived) {
      message = MessageConstants.ARCHIVED_CUSTOMER_CONVERSATION(this.me.displayName);
      type = SystemMsgType.archived;
    }
    if (request.status === Status.opened) {
      message = MessageConstants.UNARCHIVED_EMAIL_CONVERSATION(this.me.displayName);
      type = SystemMsgType.unarchived;
    }
    this.conversationGroupService.updateGroupConversation(this.conversationGroup.id, request).subscribe(
      () => {
        const messageBody: MessageBody = new MessageBody({
          text: message,
          data: <SystemMessageData>{
            type: type
          }
        });
        this.sendMessage(messageBody);
        this.toastService.success(message);
        this.removeActiveConversationGroup();
      },
      error => {
        this.showError(error);
      }
    );
  }

  private updateInboxInfo(emailInboxUuid: string) {
    this.allInboxes = this.emailIntegrationQuery.getInboxBelongToAgent();
    this.conversationInbox = this.allInboxes.find(inbox => inbox.uuid === emailInboxUuid);
  }

  private sendMessage(messageBody: MessageBody, isNoStore = false) {
    const message = ChatMessage.createEmailMessage(
      this.conversationGroup,
      new MessageBody(messageBody),
      this.me.userUuid,
      MsgType.system,
      isNoStore
    );

    this.chatService.send(message);
  }

  getHistoryMessage() {
    const loaded = this.conversationGroupQuery.getConvoUiState(this.conversationGroup.id)?.loaded;
    if (loaded) {
      return;
    }
    this.conversationGroupService.updateConvoViewState(this.conversationGroup.id, <ConversationGroupUI>{
      loaded: true
    });
    this.historyMessageService
      .get(this.conversationGroup.id, <FilterConvoMessageReq>{
        conversations: this.conversationGroup.conversationIds,
        limit: 50
      })
      .pipe(map(historyMessage => historyMessage.messages))
      .subscribe(
        () => {},
        err =>
          this.conversationGroupService.updateConvoViewState(this.conversationGroup.id, <ConversationGroupUI>{
            loaded: false
          })
      );
  }

  uploadFile(models: File[], index: number) {
    this.dialog
      .open(UploadDialogComponent, {
        width: '500px',
        disableClose: true,
        data: <UploadDialogInput>{
          file: models[index],
          ticket: this.conversationGroup,
          index: index + 1,
          max: models.length
        }
      })
      .afterClosed()
      .subscribe(
        _ => {
          index = index + 1;
          if (index < models.length) {
            this.uploadFile(models, index);
          }
        },
        _ => {
          index = index + 1;
          if (index < models.length) {
            this.uploadFile(models, index);
          }
        }
      );
  }

  trackByFn(index, item: ChatMessage) {
    return item.id;
  }
}
