import { Component, Inject, OnInit } from '@angular/core';
import {
  ConversationGroup,
  ConversationGroupService,
  EmailInbox,
  EmailIntegrationQuery,
  MoveEmailConversation
} from '@b3networks/api/workspace';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ToastService } from '@b3networks/shared/ui/toast';
import { MessageConstants } from '@b3networks/shared/common';

@Component({
  selector: 'b3n-app-move-email-inbox',
  templateUrl: './move-email-inbox.component.html',
  styleUrls: ['./move-email-inbox.component.scss']
})
export class MoveEmailToInboxDialog implements OnInit {
  filterInboxes: Observable<EmailInbox[]>;
  inboxes: EmailInbox[] = [];
  inboxControl: UntypedFormControl = new UntypedFormControl();

  constructor(
    private conversationGroupService: ConversationGroupService,
    private dialogRef: MatDialogRef<MoveEmailToInboxDialog>,
    private emailIntegrationQuery: EmailIntegrationQuery,
    private toastService: ToastService,
    @Inject(MAT_DIALOG_DATA) public channel: ConversationGroup
  ) {}

  ngOnInit() {
    this.inboxes = this.emailIntegrationQuery.getInboxBelongToAgent();
    this.filterInboxes = this.inboxControl.valueChanges.pipe(
      startWith(''),
      map(inbox => (inbox ? this._filterInboxes(inbox) : this.inboxes.slice()))
    );
  }

  displayFn(inbox?: EmailInbox): string | undefined {
    return inbox ? inbox.incommingEmail : undefined;
  }

  private _filterInboxes(value: any): EmailInbox[] {
    let filterValue = '';
    if (typeof value === 'string') {
      filterValue = value.toLowerCase();
    } else if (typeof value === 'object') {
      filterValue = value.incommingEmail.toLowerCase();
    }
    return this.inboxes.filter(inbox => inbox.incommingEmail.toLowerCase().startsWith(filterValue));
  }

  submit() {
    if (this.inboxControl.value && this.inboxControl.value.uuid) {
      if (this.inboxControl.value.uuid === this.channel.emailInboxUuid) {
        this.toastService.warning(`This email is already assigned to ${this.inboxControl.value.name}`);
      } else {
        this.conversationGroupService
          .moveConversationToOtherInbox(this.channel.conversationGroupId, this.inboxControl.value.uuid)
          .subscribe(
            () => {
              this.dialogRef.close(<MoveEmailConversation>{
                emailInboxUuid: this.inboxControl.value.uuid
              });
            },
            error => {
              this.toastService.error(error && error.message ? error.message : MessageConstants.GENERAL_ERROR);
            }
          );
      }
    }
  }
}
