import { Component } from '@angular/core';
import { ConversationGroup, EmailMessageGeneral } from '@b3networks/api/workspace';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { firstValueFrom } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { EmailConversationListAbstractComponent } from '../../shared/list/email-conversation-list-abstract.component';

@UntilDestroy()
@Component({
  selector: 'b3n-draft',
  template: ` <b3n-email-conversation-list
    [isDraft]="true"
    [convo]="conversation$ | async"
  ></b3n-email-conversation-list>`
})
export class DraftComponent extends EmailConversationListAbstractComponent {
  getConversations() {
    this.conversation$ = this.meQuery.me$.pipe(
      filter(me => !!me),
      switchMap(me => this.conversationGroupQuery.selectDraftEmail(me.identityUuid))
    );

    this.conversationGroupQuery
      .selectDraftEmailNotFetchDetail()
      .pipe(
        filter(x => x?.length > 0),
        take(1),
        untilDestroyed(this)
      )
      .subscribe(draft => {
        this.fetchDetailDraftEmail(draft);
      });
  }

  async fetchDetailDraftEmail(draft: ConversationGroup[]) {
    for await (const c of draft) {
      const data = await firstValueFrom(this.fileService.downloadFileV3(c?.draft?.s3Key));
      const fr = new FileReader();
      fr.onload = () => {
        const msg = JSON.parse(fr.result as string);
        const convo = Object.assign(new ConversationGroup(), {
          ...c,
          draft: {
            ...c.draft,
            emailMessage: new EmailMessageGeneral(msg)
          }
        });
        this.conversationGroupService.addConversation2Store(convo); // save
      };
      fr.readAsText(data.body);
    }
  }
}
