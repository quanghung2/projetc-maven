import { Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CaseActivity, CaseDetail, CaseService, CreateCaseCommentReq, User } from '@b3networks/api/workspace';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { lastValueFrom } from 'rxjs';
import { EditorComponent } from '../../../shared/component/editor/editor.component';

@Component({
  selector: 'b3n-case-activity',
  templateUrl: './case-activity.component.html',
  styleUrls: ['./case-activity.component.scss']
})
export class CaseActivityComponent implements OnChanges {
  @Input() me: User;
  @Input() case: CaseDetail;
  @Input() activity: CaseActivity;

  editingContent: string;

  isEditing: boolean;
  progressing: boolean;

  private _htmlRef: ElementRef;
  private _editor: EditorComponent;

  @ViewChild('htmlContent') set htmlElf(htmlElf: ElementRef) {
    if (htmlElf) {
      this._htmlRef = htmlElf;
    }
  }

  @ViewChild(EditorComponent) set editor(item: EditorComponent) {
    if (item) {
      this._editor = item;
      console.log(this._editor);
    }
  }

  constructor(private caseService: CaseService, private dialog: MatDialog, private toastr: ToastService) {}

  ngOnChanges(): void {
    if (this.activity) {
      this.editingContent = this.activity.description;
    }
  }

  edit() {
    this.editingContent = this._htmlRef.nativeElement.innerHTML;
    this.isEditing = true;
  }

  remove() {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: 'Delete Comment',
          message: `Are you want to delete this comment?`,
          cancelLabel: 'No',
          confirmLabel: 'Yes',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(async confirm => {
        if (confirm) {
          const iden: { id; sid; ownerOrgUuid } = this.case;
          await lastValueFrom(this.caseService.deleteComment(iden, this.activity.id));
          this.toastr.success('Deleted comment');
        }
      });
  }

  async update() {
    const data = this._editor.getContent();
    if (!data.html) {
      return;
    }

    this.progressing = true;
    const iden: { id; sid; ownerOrgUuid } = this.case;

    const req = <CreateCaseCommentReq>{ description: data.html, descriptionRaw: data.text, mentionIds: data.mentions };
    await lastValueFrom(this.caseService.updateComment(iden, this.activity.id, req));
    this._editor.resetData();
    this.progressing = false;
    this.isEditing = false;
  }
}
