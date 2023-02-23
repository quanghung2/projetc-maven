import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Pageable } from '@b3networks/api/common';
import { EmailSearchCriteriaRequestV2, Status, User } from '@b3networks/api/workspace';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import { EmailConversationListAbstractComponent } from '../../shared/list/email-conversation-list-abstract.component';

@UntilDestroy()
@Component({
  selector: 'b3n-mail-snooze',
  templateUrl: './snooze.component.html',
  styleUrls: ['./snooze.component.scss']
})
export class SnoozeComponent extends EmailConversationListAbstractComponent implements OnInit {
  cbbAgents: User[] = [];
  agentControl = new UntypedFormControl('All agent');
  filteredOptions: Observable<User[]>;
  selectedAgent: User;
  page = 0;
  size = 10;

  override init() {
    super.ngOnInit();
    this.userQuery
      .selectAllAgents()
      .pipe(
        untilDestroyed(this),
        tap(() => {
          this.selectedAgent = new User();
          this.cbbAgents = [];
        })
      )
      .subscribe(agents => {
        this.cbbAgents = [...agents];
        const allAgentOption: User = <User>{
          displayName: 'All agent',
          identityUuid: 'all'
        };
        this.cbbAgents.unshift(allAgentOption);
        this.select('All agent');
      });

    this.filteredOptions = this.agentControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }

  getConversations() {}

  select(displayName: string) {
    const selectedAgent = this.cbbAgents.find(agent => agent.displayName === displayName);

    if (this.selectedAgent && this.selectedAgent.identityUuid === selectedAgent.identityUuid) {
      return;
    }

    this.page = 0;
    this.selectedAgent = selectedAgent;
    this.searchSnoozeEmail();
  }

  private _filter(value: string): User[] {
    const filterValue = value.toLowerCase();
    return this.cbbAgents.filter(option => option.displayName.toLowerCase().indexOf(filterValue) === 0);
  }

  searchSnoozeEmail() {
    const emailCriteria = new EmailSearchCriteriaRequestV2('', Status.opened, '', '', 0, 0, '');
    emailCriteria.snoozeFrom = +new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    emailCriteria.snoozeTo = +oneYearFromNow;

    if (this.agentControl.value !== 'All agent') {
      emailCriteria.snoozeBy = this.selectedAgent.identityUuid;
    }

    const identityUuid =
      this.selectedAgent && this.selectedAgent.identityUuid !== 'all' ? this.selectedAgent.identityUuid : null;

    this.conversation$ = this.conversationGroupQuery.selectSnoozeEmail(identityUuid).pipe(untilDestroyed(this));
    const pagination: Pageable = new Pageable(this.page, 10);
    this.conversationGroupService.searchEmails(pagination, emailCriteria, this.me.userUuid).subscribe();
  }
}
