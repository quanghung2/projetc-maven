import { Component, Inject, OnInit } from '@angular/core';
import {
  CannedResponse,
  CannedResponseQuery,
  EmailInbox,
  EmailIntegrationQuery,
  EmailIntegrationService,
  EmailRule,
  EmailSignature
} from '@b3networks/api/workspace';
import { ToastService } from '@b3networks/shared/ui/toast';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { combineLatest, Observable } from 'rxjs';
import { MessageConstants } from '@b3networks/chat/shared/core';
import { IdentityProfileQuery } from '@b3networks/api/auth';

@Component({
  selector: 'b3n-rule-detail-dialog',
  templateUrl: './rule-detail-dialog.component.html',
  styleUrls: ['./rule-detail-dialog.component.scss']
})
export class RuleDetailDialogComponent implements OnInit {
  selectedInbox: string;
  cbbInboxes: EmailInbox[] = [];
  timezone: string;
  selectedCannedResponse: number;
  cbbCannedResponses: CannedResponse[] = [];

  constructor(
    private emailIntegrationService: EmailIntegrationService,
    private emailIntegrationQuery: EmailIntegrationQuery,
    private cannedResponseQuery: CannedResponseQuery,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<RuleDetailDialogComponent>,
    private identityProfileQuery: IdentityProfileQuery,
    @Inject(MAT_DIALOG_DATA) public rule: EmailRule
  ) {}

  ngOnInit(): void {
    console.log(this.rule);
    combineLatest([
      this.emailIntegrationQuery.inboxes$,
      this.cannedResponseQuery.selectEmailCannedResponses$
    ]).subscribe(([inboxes, cannedResponses]) => {
      this.cbbInboxes = inboxes;
      if (this.cbbInboxes.length > 0) {
        this.selectedInbox = this.cbbInboxes[0].uuid;
      }
      this.cbbCannedResponses = cannedResponses;
      this.selectedCannedResponse = this.rule.cannedResponseId;
      if (this.cbbCannedResponses.length > 0 && !this.selectedCannedResponse) {
        this.selectedCannedResponse = this.cbbCannedResponses[0].id;
      }
    });
    this.identityProfileQuery.currentOrg$.subscribe(org => {
      this.timezone = org.utcOffset;
    });
  }

  addChannel() {
    if (this.rule.inboxUuids.findIndex(temp => temp === this.selectedInbox) < 0) {
      this.rule.inboxUuids.push(this.selectedInbox);
    }
  }

  removeChannel(inboxUuid: string) {
    this.rule.inboxUuids = this.rule.inboxUuids.filter(x => x !== inboxUuid);
  }

  getChannelIncommingEmail(inboxUuid: string) {
    const temp = this.cbbInboxes.find(x => x.uuid === inboxUuid);
    return temp ? temp.name : '';
  }

  doUpdate() {
    if (!this.rule.name) {
      this.toastService.error('Please enter name.');
      return;
    }

    this.rule.cannedResponseId = this.selectedCannedResponse;

    let observable: Observable<EmailSignature>;
    if (this.rule.id > 0) {
      observable = this.emailIntegrationService.updateRule(this.rule);
    } else {
      observable = this.emailIntegrationService.createRule(this.rule);
    }
    observable.subscribe(
      _ => {
        this.dialogRef.close();
        this.toastService.success(this.rule.id > 0 ? 'Update successfully.' : 'Create successfully.');
      },
      error => this.toastService.error(error && error.message ? error.message : MessageConstants.DEFAULT)
    );
  }
}
