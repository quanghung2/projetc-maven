import { Component, Input, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CaseDetail, CaseService, CaseStatus, CreateCaseCommentReq, UpdateCaseReq } from '@b3networks/api/workspace';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { lastValueFrom } from 'rxjs';
import { EditorComponent } from '../../../shared/component/editor/editor.component';

@Component({
  selector: 'b3n-new-comment',
  templateUrl: './new-comment.component.html',
  styleUrls: ['./new-comment.component.scss']
})
export class NewCommentComponent {
  commenting: boolean;
  closing: boolean;

  closeCaseLableCTA = 'Close case';

  @Input() case: CaseDetail;

  @ViewChild(EditorComponent) editor: EditorComponent;

  constructor(private caseService: CaseService, private dialog: MatDialog, private toastr: ToastService) {}

  closeCase() {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: 'Close Case',
          message: `Are you want to close this case?`,
          cancelLabel: 'No',
          confirmLabel: 'Yes',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(async confirm => {
        if (confirm) {
          try {
            await this._updateCase(<UpdateCaseReq>{ status: CaseStatus.closed });
            this.toastr.success('Closed case');
          } catch (e: unknown) {
            this.toastr.warning(`Cannot close case.`);
          }
        }
      });
  }

  reopenCase() {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: 'Reopen Case',
          message: `Are you want to reopen this case?`,
          cancelLabel: 'No',
          confirmLabel: 'Yes',
          color: 'primary'
        }
      })
      .afterClosed()
      .subscribe(async confirm => {
        if (confirm) {
          try {
            await this._updateCase(<UpdateCaseReq>{ status: CaseStatus.open });
            this.toastr.success('Reopened case');
          } catch (e: unknown) {
            this.toastr.warning(`Cannot reopen case.`);
          }
        }
      });
  }

  async comment() {
    const data = this.editor.getContent();
    console.log(data);
    if (!data.html) {
      return;
    }

    this.commenting = true;
    const iden: { id; sid; ownerOrgUuid } = this.case;

    const req = <CreateCaseCommentReq>{ description: data.html, mentionIds: data.mentions };
    await lastValueFrom(this.caseService.createComment(iden, req));
    this.editor.resetData();
    this.commenting = false;
  }

  private async _updateCase(req: Partial<UpdateCaseReq>) {
    this.closing = true;
    const iden: { id; sid; ownerOrgUuid } = this.case;

    await lastValueFrom(this.caseService.updateCase(iden, req));
    this.caseService.getActivities(iden).subscribe();

    this.closing = false;
  }
}
