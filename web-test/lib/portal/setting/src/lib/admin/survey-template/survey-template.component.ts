import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NoteService, NoteTemplate } from '@b3networks/api/data';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs';
import {
  StoreSurveyTemplateComponent,
  StoreSurveyTemplateData
} from './store-survey-template/store-survey-template.component';

@Component({
  selector: 'b3n-survey-template',
  templateUrl: './survey-template.component.html',
  styleUrls: ['./survey-template.component.scss']
})
export class SurveyTemplateComponent extends DestroySubscriberComponent implements OnInit {
  loading: boolean;
  dataSource: MatTableDataSource<NoteTemplate>;
  displayedColumns = ['templateUuid', 'title', 'actions'];

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private dialog: MatDialog, private toastService: ToastService, private noteService: NoteService) {
    super();
  }

  ngOnInit(): void {
    this.loadData();
  }

  onCreate() {
    this.showDialog();
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  onDetail(temp: NoteTemplate) {
    this.showDialog(temp.templateUuid);
  }

  onDelete(temp: NoteTemplate) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Delete Survey Template',
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
          this.noteService.removeNoteTemplate(temp.templateUuid).subscribe(
            _ => {
              this.toastService.success('Delete survey template successfully');
              this.loadData();
            },
            err => this.toastService.error(err.message)
          );
        }
      });
  }

  loadData() {
    this.loading = true;
    this.noteService
      .getNoteTemplates({ module: 'survey' })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        res => {
          this.dataSource = new MatTableDataSource<NoteTemplate>(res);
          this.dataSource.paginator = this.paginator;
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  private showDialog(uuid?: string) {
    const dialogRef = this.dialog.open(StoreSurveyTemplateComponent, {
      width: '500px',
      data: { uuid } as StoreSurveyTemplateData,
      disableClose: true,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.loadData();
      }
    });
  }
}
