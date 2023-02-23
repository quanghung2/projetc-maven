import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Pageable } from '@b3networks/api/common';
import { FileService } from '@b3networks/api/file';
import {
  ChatService,
  ConversationGroupQuery,
  ConversationGroupService,
  ConversationGroupState,
  EmailIntegrationQuery,
  EmailIntegrationService,
  EmailSearchCriteriaRequestV2,
  HistoryMessageService,
  MeQuery,
  Status,
  UserQuery
} from '@b3networks/api/workspace';
import { AppQuery } from '@b3networks/chat/shared/core';
import { ToastService } from '@b3networks/shared/ui/toast';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { forkJoin, of } from 'rxjs';
import { catchError, filter, finalize } from 'rxjs/operators';
import { EmailConversationListAbstractComponent } from '../../shared/list/email-conversation-list-abstract.component';

@UntilDestroy()
@Component({
  selector: 'b3n-teammate-convo',
  templateUrl: './teammate-convo.component.html'
})
export class TeammateConvoComponent extends EmailConversationListAbstractComponent {
  isLoadingMore: boolean;

  constructor(
    meQuery: MeQuery,
    historyMessageService: HistoryMessageService,
    conversationGroupQuery: ConversationGroupQuery,
    userQuery: UserQuery,
    conversationGroupService: ConversationGroupService,
    dialog: MatDialog,
    toastService: ToastService,
    chatService: ChatService,
    emailIntegrationService: EmailIntegrationService,
    emailIntegrationQuery: EmailIntegrationQuery,
    activatedRoute: ActivatedRoute,
    fileService: FileService,
    appQuery: AppQuery
  ) {
    super(
      meQuery,
      historyMessageService,
      conversationGroupQuery,
      userQuery,
      conversationGroupService,
      dialog,
      toastService,
      chatService,
      emailIntegrationService,
      emailIntegrationQuery,
      activatedRoute,
      fileService,
      appQuery
    );
  }

  getConversations() {
    this.activatedRoute.params
      .pipe(
        filter(queryParams => !!queryParams),
        untilDestroyed(this)
      )
      .subscribe(queryParams => {
        this.removeActiveConversationGroup();

        this.conversation$ = this.conversationGroupQuery
          .selectEmailAssignedToTeammates(queryParams['id'])
          .pipe(untilDestroyed(this));
      });
  }

  loadMore() {
    if (!this.isLoadingMore) {
      this.isLoadingMore = true;
      const exceptionInboxUuids = this.emailIntegrationQuery.getExceptionInboxUuids();

      const inboxPaging = this.conversationGroupQuery.getValue()?.emailInboxPaging;
      const pageable: Pageable = {
        page: inboxPaging.page + 1 || 1,
        perPage: inboxPaging.perPage || 10
      };
      if (pageable.page === 1 && inboxPaging.loaded) {
        return;
      }

      const api$ = [];
      const me = this.meQuery.getMe();
      exceptionInboxUuids.forEach(inboxUuid => {
        api$.push(this.getConvoByExceptionInboxUuid(inboxUuid, me.userUuid, pageable));
      });

      forkJoin(api$)
        .pipe(finalize(() => (this.isLoadingMore = false)))
        .subscribe(_ => {
          this.conversationGroupService.updateStateStore(<ConversationGroupState>{
            emailInboxPaging: {
              loaded: true,
              page: pageable.page,
              perPage: pageable.perPage
            }
          });
        });
    }
  }

  private getConvoByExceptionInboxUuid(inboxUuid: string, meUserUuid: string, pageable: Pageable) {
    const emailCriteria = new EmailSearchCriteriaRequestV2('', Status.opened, '', '', 0, 0, inboxUuid);
    return this.conversationGroupService
      .searchEmails(pageable, emailCriteria, meUserUuid)
      .pipe(catchError(() => of([])));
  }
}
