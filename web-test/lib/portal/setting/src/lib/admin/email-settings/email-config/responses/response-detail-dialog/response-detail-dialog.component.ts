import { Component, Inject, OnInit } from '@angular/core';
import { CannedResponse, CannedResponseService, EmailInbox, EmailIntegrationQuery } from '@b3networks/api/workspace';
import { ToastService } from '@b3networks/shared/ui/toast';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { MessageConstants } from '@b3networks/chat/shared/core';
import { UntypedFormControl } from '@angular/forms';

@Component({
  selector: 'b3n-response-detail-dialog',
  templateUrl: './response-detail-dialog.component.html',
  styleUrls: ['./response-detail-dialog.component.scss']
})
export class ResponseDetailDialogComponent implements OnInit {
  inboxControl = new UntypedFormControl();
  addedInboxes: EmailInbox[] = [];
  teamInboxes: EmailInbox[] = [];

  constructor(
    private cannedResponseService: CannedResponseService,
    private emailIntegrationQuery: EmailIntegrationQuery,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<ResponseDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public response: CannedResponse
  ) {}

  ngOnInit() {
    this.teamInboxes = this.emailIntegrationQuery.getValue().inboxes;
    this.updateInboxes();
  }

  updateInboxes() {
    this.addedInboxes = [];
    if (this.teamInboxes.length > 0) {
      if (this.response && this.response.inbox) {
        this.response.inbox.split(',').forEach(x => {
          if (
            !this.addedInboxes
              .map(inbox => inbox.uuid)
              .join(',')
              .includes(x)
          ) {
            const temp = this.teamInboxes.find(y => y.uuid === x);
            if (temp) {
              this.addedInboxes.push(temp);
            }
          }
        });
      }
    }
  }

  displayFn(inbox?: EmailInbox): string | undefined {
    return inbox ? inbox.name : undefined;
  }

  doUpdate() {
    if (!this.response.name) {
      this.toastService.error('Please enter name.');
      return;
    }
    if (!this.response.content) {
      this.toastService.error('Please enter response content.');
      return;
    }
    this.response.inbox = this.addedInboxes.map(x => x.uuid).join(',');
    let observable: Observable<CannedResponse>;
    if (this.response.id > 0) {
      observable = this.cannedResponseService.updateEmailCannedResponse(this.response);
    } else {
      observable = this.cannedResponseService.createEmailCannedResponse(this.response);
    }
    observable.subscribe(
      _ => {
        this.dialogRef.close();
        this.toastService.success(this.response.id > 0 ? 'Update successfully.' : 'Create successfully.');
      },
      error => this.toastService.error(error && error.message ? error.message : MessageConstants.DEFAULT)
    );
  }

  addInbox() {
    if (this.inboxControl.value) {
      if (
        !this.addedInboxes
          .map(x => x.uuid)
          .join(',')
          .includes(this.inboxControl.value.uuid)
      ) {
        this.addedInboxes.push(this.inboxControl.value);
      }
    }
  }

  deleteInbox(item: EmailInbox) {
    this.addedInboxes = this.addedInboxes.filter(x => x.uuid !== item.uuid);
  }
}
