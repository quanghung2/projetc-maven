import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoteService, NoteTemplate, TemplateModule } from '@b3networks/api/data';
import { finalize } from 'rxjs';
import { NoteConfigComponent } from '../../queue/note-config/note-config.component';

export interface StoreSurveyTemplateData {
  uuid: string;
}

@Component({
  selector: 'b3n-store-survey-template',
  templateUrl: './store-survey-template.component.html',
  styleUrls: ['./store-survey-template.component.scss']
})
export class StoreSurveyTemplateComponent implements OnInit {
  loading: boolean;
  noteTemplate: NoteTemplate;
  module: TemplateModule = 'survey';

  constructor(
    public dialogRef: MatDialogRef<NoteConfigComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StoreSurveyTemplateData,
    private noteService: NoteService
  ) {}

  ngOnInit(): void {
    if (this.data.uuid) {
      this.loading = true;
      this.noteService
        .getNoteTemplate(this.data.uuid)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(res => {
          this.noteTemplate = res;
        });
    }
  }

  onCancel(e?: any) {
    this.dialogRef.close(e);
  }
}
