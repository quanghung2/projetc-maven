import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Pageable } from '@b3networks/api/common';
import {
  AgentInbox,
  ConversationGroupQuery,
  ConversationGroupService,
  ConversationGroupState,
  EmailInbox,
  EmailIntegrationQuery,
  EmailIntegrationService,
  EmailSearchCriteriaRequestV2,
  MeQuery,
  Status
} from '@b3networks/api/workspace';
import { AppQuery, AppService, EmailMenuItem, EmailUWState } from '@b3networks/chat/shared/core';
import { CreateInboxDialogComponent } from '@b3networks/chat/shared/email';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { combineLatest, forkJoin, Observable, of } from 'rxjs';
import { catchError, map, startWith, switchMap, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'b3n-email-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss']
})
export class EmailTeamComponent implements OnInit, OnDestroy {
  menus: EmailMenuItem[] = [];
  inboxControl = new UntypedFormControl();
  filterInboxes: Observable<EmailInbox[]>;
  inboxes: EmailInbox[] = [];
  agentInboxes: AgentInbox[] = [];
  displayInboxes: EmailInbox[] = [];
  isExpand$: Observable<boolean>;

  constructor(
    private appQuery: AppQuery,
    private appService: AppService,
    private conversationGroupQuery: ConversationGroupQuery,
    private conversationGroupService: ConversationGroupService,
    private emailIntegrationService: EmailIntegrationService,
    private emailIntegrationQuery: EmailIntegrationQuery,
    private meQuery: MeQuery,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.isExpand$ = this.appQuery.emailUWState$.pipe(map(x => x?.isExpandTeam));
    this.initTeamComponent();

    this.filterInboxes = this.inboxControl.valueChanges.pipe(
      startWith(''),
      map(inbox => this._filterInboxes(inbox))
    );
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
      emailUWState: { ...emailState, isExpandTeam: !emailState.isExpandTeam }
    });
  }

  private initTeamComponent() {
    combineLatest([
      this.emailIntegrationQuery.inboxes$,
      this.emailIntegrationQuery.agentInboxes$,
      this.meQuery.me$.pipe(
        switchMap(me => {
          return this.emailIntegrationQuery.exceptionInboxUuids$.pipe(
            tap(exceptionInboxUuids => {
              const api$ = [];
              const inboxPaging = this.conversationGroupQuery.getValue()?.emailInboxPaging;

              const pageable: Pageable = {
                page: inboxPaging.page || 1,
                perPage: inboxPaging.perPage || 10
              };

              if (pageable.page === 1 && inboxPaging.loaded) {
                return;
              }

              exceptionInboxUuids.forEach(inboxUuid => {
                api$.push(this.getConvoByExceptionInboxUuid(inboxUuid, me.userUuid, pageable));
              });

              forkJoin(api$).subscribe(_ => {
                this.conversationGroupService.updateStateStore(<ConversationGroupState>{
                  emailInboxPaging: {
                    loaded: true,
                    page: pageable.page,
                    perPage: pageable.perPage
                  }
                });
              });
            })
          );
        })
      ),
      this.conversationGroupQuery.selectEmailConversation()
    ])
      .pipe(untilDestroyed(this))
      .subscribe(([inboxes, agentInboxes, _, convos]) => {
        this.inboxes = inboxes;
        this.agentInboxes = agentInboxes;
        this.updateDisplayInbox();

        this.menus = this.initMenu();
        const inboxMapper: EmailMenuItem[] = this.displayInboxes.map(inbox => {
          return <EmailMenuItem>{
            displayText: inbox.name,
            routerLink: ['email', 'team', 'team-inbox', inbox.uuid],
            count: convos.filter(x => x.isEmailBelongToInbox(inbox.uuid)).length
          };
        });
        this.menus = inboxMapper.concat(this.menus);
      });
  }

  ngOnDestroy() {}

  private _filterInboxes(value: any): EmailInbox[] {
    let filterValue = '';
    if (typeof value === 'string') {
      filterValue = value.toLowerCase();
    } else if (typeof value === 'object') {
      filterValue = value.name.toLowerCase();
    }
    return this.inboxes
      .filter(x => this.agentInboxes.findIndex(y => y.inboxUuid === x.uuid) === -1)
      .filter(inbox => inbox.name.toLowerCase().includes(filterValue));
  }

  private initMenu(): EmailMenuItem[] {
    return [
      { displayText: 'Schedule', icon: 'schedule', routerLink: ['email', 'team', 'schedule'] },
      { displayText: 'Snooze', icon: 'snooze', routerLink: ['email', 'team', 'snooze'] },
      { displayText: 'Archived', icon: 'delete', routerLink: ['email', 'team', 'archived'] }
    ];
  }

  stopPropagation(e) {
    e.stopPropagation();
  }

  displayFn(inbox?: EmailInbox): string | undefined {
    return inbox ? inbox.name : undefined;
  }

  addInbox() {
    if (this.inboxControl.value) {
      this.emailIntegrationService
        .addAgentInbox(this.inboxControl.value.uuid)
        .pipe(untilDestroyed(this))
        .subscribe(
          () => this.inboxControl.setValue(''),
          () => {}
        );
    }
  }

  removeInbox(inbox) {
    inbox.removing = true;
    this.emailIntegrationService.deleteAgentInbox(inbox.uuid).pipe(untilDestroyed(this)).subscribe();
  }

  openCreateInboxDlg() {
    this.dialog.open(CreateInboxDialogComponent, {
      width: '600px'
    });
  }

  private updateDisplayInbox() {
    if (this.agentInboxes && this.agentInboxes.length > 0) {
      this.displayInboxes = this.inboxes.filter(x => this.agentInboxes.findIndex(y => y.inboxUuid === x.uuid) >= 0);
    } else {
      this.displayInboxes = this.inboxes;
    }
  }

  private getConvoByExceptionInboxUuid(inboxUuid: string, meUserUuid: string, pageable: Pageable) {
    const emailCriteria = new EmailSearchCriteriaRequestV2('', Status.opened, '', '', 0, 0, inboxUuid);
    return this.conversationGroupService
      .searchEmails(pageable, emailCriteria, meUserUuid)
      .pipe(catchError(() => of([])));
  }
}
