import { Component, OnInit } from '@angular/core';
import { ConversationGroupQuery, EmailInbox, User, UserQuery } from '@b3networks/api/workspace';
import { AppQuery, AppService, EmailMenuItem, EmailUWState } from '@b3networks/chat/shared/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { combineLatest, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'b3n-email-teammate',
  templateUrl: './teammate.component.html',
  styleUrls: ['./teammate.component.scss']
})
export class EmailTeammateComponent implements OnInit {
  inboxes: EmailInbox[];
  menus: EmailMenuItem[] = [];
  isExpand$: Observable<boolean>;

  constructor(
    private appQuery: AppQuery,
    private appService: AppService,
    private userQuery: UserQuery,
    private conversationGroupQuery: ConversationGroupQuery
  ) {}

  ngOnInit(): void {
    this.isExpand$ = this.appQuery.emailUWState$.pipe(map(x => x?.isExpandTeammate));

    combineLatest([
      this.userQuery.selectAllAgents(),
      this.conversationGroupQuery.selectEmailConversation().pipe(filter(convos => !!convos.length))
    ])
      .pipe(untilDestroyed(this))
      .subscribe(([agents, convos]) => {
        agents = this.sortByDisplayName(agents);
        this.menus = [{ displayText: 'All teammates', icon: 'group', routerLink: ['email', 'teammate', ''], count: 0 }];
        const menuMapper: EmailMenuItem[] = agents.map(agent => {
          return <EmailMenuItem>{
            displayText: agent.displayName,
            routerLink: ['email', 'teammate', agent.userUuid],
            agent: agent,
            count: convos.filter(x => x.isEmailAssignedToTeammates(agent.userUuid)).length
          };
        });
        this.menus = this.menus.concat(menuMapper);
        this.menus.filter(menu => menu.count > 0).forEach(menu => (this.menus[0].count += menu.count));
      });
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
      emailUWState: { ...emailState, isExpandTeammate: !emailState.isExpandTeammate }
    });
  }

  sortByDisplayName(array: User[]) {
    array.sort(function (a, b) {
      const nameA = a.displayName.toUpperCase();
      const nameB = b.displayName.toUpperCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }

      // names must be equal
      return 0;
    });

    return array;
  }
}
