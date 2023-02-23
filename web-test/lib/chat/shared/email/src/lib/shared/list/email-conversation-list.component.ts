import { Component, Input, OnInit } from '@angular/core';
import { ConversationGroup, EmailMessageGeneral } from '@b3networks/api/workspace';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ComposeEmailDialogData, ComposeEmailMessageComponent } from '../../compose/compose.component';
import { EmailConversationListAbstractComponent } from './email-conversation-list-abstract.component';

@UntilDestroy()
@Component({
  selector: 'b3n-email-conversation-list',
  templateUrl: 'email-conversation-list.component.html',
  styleUrls: ['email-conversation-list.component.scss']
})
export class EmailConversationListComponent extends EmailConversationListAbstractComponent implements OnInit {
  @Input() set convo(conversations: ConversationGroup[]) {
    this.conversations = conversations;
  }
  @Input() isDisplayHeaderActions = true;
  @Input() hasLoadMoreButton = false;
  @Input() override isDraft = false;

  messageLoading$: Observable<boolean> = new Observable<boolean>();

  override ngOnInit() {
    super.ngOnInit();

    setTimeout(() => {
      this.messageLoading$ = this.conversationGroupQuery.loading$;
    }, 500);

    this.activatedRoute.queryParams
      .pipe(
        filter(queryParams => !!queryParams),
        untilDestroyed(this)
      )
      .subscribe(params => {
        console.log('queryParams: ', params);
        if (params['convoChildId']) {
          const convoChildId = params['convoChildId'];
          const convo = this.conversationGroupQuery.getConvosByChildId(convoChildId);
          if (convo.length > 0) {
            this.onSelectConvo(convo[0]);
          } else {
            this.conversationGroupService
              .getConversationDetail(convoChildId, this.meQuery.getMe()?.userUuid, true)
              .subscribe(detail => {
                if (detail) {
                  this.onSelectConvo(detail);
                }
              });
          }
        }
      });
  }

  getConversations() {}

  override openDraftEmail(conversationGroup: ConversationGroup) {
    if (conversationGroup.draft.emailMessage) {
      this.openComposeDialog(conversationGroup.draft.emailMessage);
    } else {
      this.fileService.downloadFileV3(conversationGroup.draft.s3Key).subscribe(data => {
        const fr = new FileReader();
        fr.onload = () => {
          const msg = JSON.parse(fr.result as string);
          this.openComposeDialog(msg);
        };
        fr.readAsText(data.body);
      });
    }
  }

  protected openComposeDialog(msg: EmailMessageGeneral) {
    const dialogRef = this.dialog.open(ComposeEmailMessageComponent, {
      width: '1000px',
      data: <ComposeEmailDialogData>{
        msg: msg,
        conversationGroup: this.selectedConversationGroup,
        isDraft: true
      },
      disableClose: true,
      panelClass: 'position-relative'
    });

    dialogRef.afterClosed().subscribe(_ => (this.selectedConversationGroup = new ConversationGroup()));
  }
}
