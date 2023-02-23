import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthorService, TriggerLinkRes } from '@b3networks/api/flow';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, tap } from 'rxjs/operators';

export interface TriggerLinkDialogInput {
  connectorUuid: string;
  actionDefUuid: string;
}

@Component({
  selector: 'b3n-trigger-link',
  templateUrl: './trigger-link-dialog.component.html',
  styleUrls: ['./trigger-link-dialog.component.scss']
})
export class TriggerLinkDialogComponent implements OnInit {
  setting: boolean;
  triggerLinks: TriggerLinkRes[];
  listTriggerDefUuid: string[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) private inputDialog: TriggerLinkDialogInput,
    private dialogRef: MatDialogRef<TriggerLinkDialogComponent>,
    private authorService: AuthorService,
    private toastServive: ToastService
  ) {}

  ngOnInit() {
    this.authorService
      .getTriggerLink(this.inputDialog.connectorUuid, this.inputDialog.actionDefUuid)
      .pipe(
        tap(triggerLinks => {
          this.triggerLinks = triggerLinks;
          triggerLinks.forEach(link => {
            this.listTriggerDefUuid.push(...link.triggerDefs.filter(t => t.linked === true).map(t => t.originalUuid));
          });
        })
      )
      .subscribe();
  }

  set() {
    this.setting = true;
    this.authorService
      .setTriggerLink(this.inputDialog.connectorUuid, this.inputDialog.actionDefUuid, {
        triggerDefUuidsWillBeTriggered: this.listTriggerDefUuid
      })
      .pipe(finalize(() => (this.setting = false)))
      .subscribe({
        next: () => {
          this.toastServive.success('Action def has been linked to event');
          this.dialogRef.close();
        },
        error: err => this.toastServive.error(err.message)
      });
  }
}
