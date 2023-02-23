import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import {
  AgentInbox,
  EmailInbox,
  EmailIntegrationQuery,
  EmailIntegrationService,
  ResponseLevel
} from '@b3networks/api/workspace';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InboxDetailDialogComponent } from './inbox-detail-dialog/inbox-detail-dialog.component';

@Component({
  selector: 'b3n-inboxes',
  templateUrl: './inboxes.component.html',
  styleUrls: ['./inboxes.component.scss']
})
export class InboxesComponent extends DestroySubscriberComponent implements OnInit, AfterViewInit {
  level: ResponseLevel;
  displayInboxes: EmailInbox[] = [];
  agentInboxes: AgentInbox[] = [];
  inboxes: EmailInbox[] = [];
  inboxControl = new UntypedFormControl();
  displayedColumns = ['displayName', 'email', 'action'];
  dataSource: MatTableDataSource<EmailInbox> = new MatTableDataSource<EmailInbox>(this.displayInboxes);
  ResponseLevel = ResponseLevel;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  constructor(
    private emailIntegrationService: EmailIntegrationService,
    private emailIntegrationQuery: EmailIntegrationQuery,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog
  ) {
    super();
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      if (params) {
        this.level = params['level'];
        if (this.inboxes) {
          this.filterInboxByLevel();
        }
      }
    });
  }

  ngAfterViewInit() {
    combineLatest([this.emailIntegrationQuery.inboxes$, this.emailIntegrationQuery.agentInboxes$])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([inboxes, agentInboxes]) => {
        this.inboxes = inboxes;
        this.agentInboxes = agentInboxes;
        this.filterInboxByLevel();
      });
  }

  filterInboxByLevel() {
    if (this.level === ResponseLevel.ORGANIZATION) {
      this.displayInboxes = this.inboxes;
    } else {
      if (this.agentInboxes.length) {
        this.displayInboxes = this.inboxes.filter(x => this.agentInboxes.findIndex(y => y.inboxUuid === x.uuid) >= 0);
      }
    }
    this.updateDataSource();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.dataSource.filterPredicate = (data: EmailInbox, value: string): boolean => {
      return data.name.toLowerCase().indexOf(value) > -1 || data.incommingEmail.toLowerCase().indexOf(value) > -1;
    };
  }

  private updateDataSource() {
    this.dataSource = new MatTableDataSource<EmailInbox>(this.displayInboxes);
    this.dataSource.paginator = this.paginator;
  }

  displayFn(inbox?: EmailInbox): string | undefined {
    return inbox ? inbox.name : undefined;
  }

  addAgentInbox() {
    if (
      this.inboxControl.value &&
      this.agentInboxes.findIndex(item => item.inboxUuid === this.inboxControl.value.uuid) === -1
    ) {
      this.emailIntegrationService.addAgentInbox(this.inboxControl.value.uuid).subscribe();
    }
  }

  viewDetail(emailInbox: EmailInbox) {
    if (this.level === ResponseLevel.PERSONAL) {
      return;
    }
    if (!emailInbox) {
      emailInbox = { uuid: '', name: '' };
    }

    this.dialog.open(InboxDetailDialogComponent, {
      width: '950px',
      data: { ...emailInbox }
    });
  }

  delete(isDelete: boolean, inbox: EmailInbox) {
    if (isDelete) {
      if (this.level === ResponseLevel.PERSONAL) {
        this.emailIntegrationService.deleteAgentInbox(inbox.uuid).subscribe();
      } else {
        this.emailIntegrationService.deleteOrgInbox(inbox.uuid).subscribe();
      }
    }
  }
}
