import { Component, OnInit } from '@angular/core';
import { FileService } from '@b3networks/api/file';
import {
  CannedResponseService,
  ConversationGroupService,
  EmailIntegrationQuery,
  EmailIntegrationService,
  MeQuery,
  User
} from '@b3networks/api/workspace';
import { DestroySubscriberComponent, MessageConstants } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-email',
  templateUrl: './email.component.html',
  styleUrls: ['./email.component.scss']
})
export class EmailComponent extends DestroySubscriberComponent implements OnInit {
  page = 0;
  perPage = 100;
  me: User;

  constructor(
    private emailIntegrationService: EmailIntegrationService,
    private emailIntegrationQuery: EmailIntegrationQuery,
    private conversationGroupService: ConversationGroupService,
    private toastService: ToastService,
    private meQuery: MeQuery,
    private cannedResponseService: CannedResponseService,
    protected fileService: FileService
  ) {
    super();
  }

  ngOnInit() {
    this.initEmailData();
    this.meQuery.me$
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(me => !!me),
        take(1)
      )
      .subscribe(me => {
        this.me = me;
        this.getEmailConversationGroup();
      });
  }

  private getEmailConversationGroup() {
    this.conversationGroupService
      .getEmailConversationGroup(this.me.userUuid, { page: this.page, perPage: this.perPage })
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(
        convos => {
          if (convos.length === this.perPage) {
            this.page++;
            this.getEmailConversationGroup();
          }
        },
        () => {
          this.toastService.error(MessageConstants.GENERAL_ERROR);
        }
      );
  }

  private initEmailData() {
    const loaded = this.emailIntegrationQuery.getValue()?.loaded;

    if (loaded) {
      return;
    }

    forkJoin([
      this.conversationGroupService.getDraftEmails(),
      this.emailIntegrationService.getEmailSchedule(),
      this.emailIntegrationService.getInboxes(),
      this.emailIntegrationService.getExceptionInboxes(),
      this.emailIntegrationService.getAgentInbox(),
      this.emailIntegrationService.getSignatures(),
      this.emailIntegrationService.getTags(),
      this.cannedResponseService.getEmailCannedResponse()
    ])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(
        res => {
          this.emailIntegrationService.updateLoadedEmail(true);
        },
        () => {
          this.toastService.error(MessageConstants.GENERAL_ERROR);
        }
      );
  }
}
