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
  selector: 'b3n-mail-archived',
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.scss']
})
export class ArchivedComponent extends EmailConversationListAbstractComponent implements OnInit {
  cbbAgents: User[] = [];
  agentControl = new UntypedFormControl('All agent');
  filteredOptions: Observable<User[]>;
  selectedAgent: User;
  page = 0;
  size = 10;
  hasLoadMoreButton = true;

  private _filter(value: string): User[] {
    const filterValue = value.toLowerCase();
    return this.cbbAgents.filter(option => option.displayName.toLowerCase().indexOf(filterValue) === 0);
  }

  getConversations(): void {}

  override init() {
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

  searchArchiveEmail() {
    const emailCriteria = new EmailSearchCriteriaRequestV2('', Status.archived, '', '', 0, 0, '');
    emailCriteria.archivedBy = this.selectedAgent.identityUuid === 'all' ? null : this.selectedAgent.identityUuid;

    this.conversation$ = this.conversationGroupQuery
      .selectArchivedConvoByAgentID(emailCriteria.archivedBy)
      .pipe(untilDestroyed(this));

    const pagination: Pageable = new Pageable(this.page, 10);
    this.conversationGroupService
      .searchEmails(pagination, emailCriteria, this.me.userUuid)
      .pipe(untilDestroyed(this))
      .subscribe(convos => (this.hasLoadMoreButton = !!(convos && convos.length)));
  }

  select(displayName: string) {
    const selectedAgent = this.cbbAgents.find(agent => agent.displayName === displayName);

    if (this.selectedAgent && this.selectedAgent.identityUuid === selectedAgent.identityUuid) {
      return;
    }

    this.page = 0;
    this.selectedAgent = selectedAgent;
    this.searchArchiveEmail();
  }

  loadMore() {
    this.page++;
    this.searchArchiveEmail();
  }
}
