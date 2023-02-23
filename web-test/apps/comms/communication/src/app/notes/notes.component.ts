import { Component, OnInit } from '@angular/core';
import { ToastService } from '@b3networks/shared/ui/toast';
import { MatTableDataSource } from '@angular/material/table';
import { NoteService, NoteTemplate } from '@b3networks/api/data';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ViewConfigComponent } from './view-config/view-config.component';
import { DownloadComponent } from './download/download.component';

@Component({
  selector: 'b3n-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss']
})
export class NotesComponent extends DestroySubscriberComponent implements OnInit {
  readonly displayedColumns = ['uuid', 'module', 'name', 'actions'];

  noteDataSource: MatTableDataSource<NoteTemplate>;

  constructor(private toastService: ToastService, private noteService: NoteService, private dialog: MatDialog) {
    super();
  }

  ngOnInit(): void {
    this.noteService
      .getNoteTemplates()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(
        notes => {
          this.noteDataSource = new MatTableDataSource<NoteTemplate>(notes);
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  copy(event: MouseEvent) {
    event.stopPropagation();
    this.toastService.success('Copied to clipboard');
  }

  viewConfig(note: NoteTemplate) {
    this.dialog.open(ViewConfigComponent, {
      width: '450px',
      autoFocus: false,
      data: note
    });
  }

  openDownloadDialog(note: NoteTemplate) {
    this.dialog.open(DownloadComponent, {
      width: '400px',
      data: note
    });
  }
}
