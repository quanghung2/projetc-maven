import { Component, OnInit } from '@angular/core';
import { ConversationGroupQuery, MeQuery } from '@b3networks/api/workspace';
import { AppQuery, AppService, EmailMenuItem, EmailUWState } from '@b3networks/chat/shared/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'b3n-email-personal',
  templateUrl: './personal.component.html',
  styleUrls: ['./personal.component.scss']
})
export class EmailPersonalComponent implements OnInit {
  personalMenu: EmailMenuItem[] = [
    { displayText: 'Assigned to me', icon: 'assignment_ind', routerLink: ['email', 'personal', 'assigned-to-me'] },
    { displayText: 'Following', icon: 'remove_red_eye', routerLink: ['email', 'personal', 'following'] },
    { displayText: 'Drafts', icon: 'drafts', routerLink: ['email', 'personal', 'draft'] },
    { displayText: 'Sent', icon: 'send', routerLink: ['email', 'personal', 'sent'] }
  ];
  isExpand$: Observable<boolean>;

  constructor(
    private appQuery: AppQuery,
    private appService: AppService,
    private conversationGroupQuery: ConversationGroupQuery,
    private meQuery: MeQuery
  ) {}

  ngOnInit(): void {
    this.isExpand$ = this.appQuery.emailUWState$.pipe(map(x => x?.isExpandPersonal));
    this.conversationGroupQuery
      .selectEmailConversation()
      .pipe(
        filter(convos => !!convos.length),
        untilDestroyed(this)
      )
      .subscribe(convos => {
        this.personalMenu[this.getMenuIndex('assigned-to-me')].count = convos.filter(x => x.isEmailAssignedToMe).length;
        this.personalMenu[this.getMenuIndex('following')].count = convos.filter(
          x => x.isFollowingConversationByMe
        ).length;
      });

    this.meQuery.me$
      .pipe(
        filter(me => !!me),
        switchMap(me => this.conversationGroupQuery.selectDraftEmail(me.identityUuid)),
        untilDestroyed(this)
      )
      .subscribe(convo => (this.personalMenu[this.getMenuIndex('draft')].count = convo.length));
  }

  toggleView() {
    const emailState =
      this.appQuery.getValue()?.emailUWState ||
      <EmailUWState>{
        isExpandPersonal: false,
        isExpandTeam: false,
        isExpandTeammate: false
      };
    this.appService.update({
      emailUWState: { ...emailState, isExpandPersonal: !emailState.isExpandPersonal }
    });
  }

  getMenuIndex(link: 'assigned-to-me' | 'following' | 'draft' | 'sent') {
    return this.personalMenu.findIndex(menu => menu.routerLink.indexOf(link) > -1);
  }
}
