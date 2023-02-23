import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { GetNoteTemplate, NoteService, NoteTemplate } from '@b3networks/api/data';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { filter, finalize, take, takeUntil } from 'rxjs/operators';
import { FormDetailsComponent } from './form-details/form-details.component';
import { FormStoreComponent, StoreFormInput } from './form-store/form-store.component';

@Component({
  selector: 'b3n-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent extends DestroySubscriberComponent implements OnInit {
  noteTemplates: NoteTemplate[];
  isLoading: boolean;
  editable: boolean;
  displayedColumns = ['templateUuid', 'title', 'actions'];

  constructor(
    private noteService: NoteService,
    private toastService: ToastService,
    private dialog: MatDialog,
    private profileQuery: IdentityProfileQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.reload();
    this.profileQuery
      .select(state => state.currentOrg)
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(profileOrg => !!profileOrg),
        take(1)
      )
      .subscribe(profileOrg => {
        this.editable = !profileOrg.isMember;
      });
  }

  reload() {
    this.isLoading = true;
    this.noteService
      .getNoteTemplates({ module: 'flow' } as GetNoteTemplate)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(noteTemplates => {
        this.noteTemplates = noteTemplates.sort((a, b) => a.title.localeCompare(b.title));
      });
  }

  updateOrCreate(noteTemplate?: NoteTemplate) {
    this.dialog
      .open(FormStoreComponent, {
        width: '450px',
        data: <StoreFormInput>{
          noteTemplate: noteTemplate
        },
        disableClose: true,
        autoFocus: false
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.reload();
        }
      });
  }

  deleteTemp(noteTemplate: NoteTemplate) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Delete Note Template',
          message: `Please ensure this template didn't use on active flows before deleting it.`,
          cancelLabel: 'Cancel',
          confirmLabel: 'Delete',
          color: 'warn'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.noteService.removeNoteTemplate(noteTemplate.templateUuid).subscribe(
            _ => {
              this.reload();
              this.toastService.success('Delete note template successfully');
            },
            err => this.toastService.error(err.message)
          );
        }
      });
  }

  viewDetail(noteTemplate: NoteTemplate) {
    this.dialog.open(FormDetailsComponent, {
      width: '450px',
      data: <StoreFormInput>{
        noteTemplate: noteTemplate
      },
      disableClose: true
    });
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }
}
