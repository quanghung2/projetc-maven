import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { QueueConfig, QueueInfo, QueueService } from '@b3networks/api/callcenter';
import { GetNoteTemplate, NoteService, NoteTemplate } from '@b3networks/api/data';
import { DestroySubscriberComponent, MyErrorStateMatcher } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-note-config',
  templateUrl: './note-config.component.html',
  styleUrls: ['./note-config.component.scss']
})
export class NoteConfigComponent extends DestroySubscriberComponent implements OnInit {
  matcher = new MyErrorStateMatcher();
  form: UntypedFormGroup;
  showNoteTemplateForm: boolean;
  noteTemplates: NoteTemplate[];
  noteTemplate: NoteTemplate;
  queueConfig: QueueConfig;

  loading = true;
  removing = false;
  saving = false;

  get script() {
    return this.form.get('script');
  }

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<NoteConfigComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QueueInfo,
    private noteService: NoteService,
    private fb: UntypedFormBuilder,
    private toastService: ToastService,
    private queueService: QueueService
  ) {
    super();
  }

  ngOnInit() {
    this.initForm();
    this.initData();
  }

  initData() {
    this.loading = true;

    forkJoin([
      this.queueService.getQueueConfig(this.data.uuid),
      this.noteService.getNoteTemplates({ module: 'callcenter' } as GetNoteTemplate)
    ])
      .pipe(
        tap(([queueConfig, noteTemplates]) => {
          this.queueConfig = queueConfig;
          this.form.get('script').setValue(this.queueConfig.agentWorkflowConfig?.script);
          this.form.get('disableNotes').setValue(this.queueConfig.agentWorkflowConfig?.disableNotes);
          this.noteTemplates = noteTemplates.sort((a, b) => a.title.localeCompare(b.title));

          if (!this.noteTemplates.length) {
            this.loading = false;
            this.noteTemplate = null;

            return;
          }

          const queueTemplateUuid = this.queueConfig.agentWorkflowConfig.noteTemplateId;
          const defaultTemplateUuid = this.noteTemplates[0].templateUuid;

          //* In case data of queueConfig and noteTemplates are not sync
          if (queueTemplateUuid) {
            const noteTemplate = this.noteTemplates.find(n => n.templateUuid === queueTemplateUuid);
            this.form.controls['noteTemplate'].setValue(noteTemplate ? queueTemplateUuid : defaultTemplateUuid);
          } else {
            this.form.controls['noteTemplate'].setValue(defaultTemplateUuid);
          }
        })
      )
      .subscribe();
  }

  initForm() {
    this.form = this.fb.group({
      noteTemplate: ['', Validators.required],
      script: ['', Validators.maxLength(2000)],
      disableNotes: ''
    });

    this.form.controls['noteTemplate'].valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(async templateUuid => {
          this.noteTemplate = await this.noteService.getNoteTemplate(templateUuid).toPromise();
          this.loading = false;
        })
      )
      .subscribe();
  }

  removeTemplate() {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        autoFocus: false,
        data: <ConfirmDialogInput>{
          title: 'Remove',
          message: `Are you sure to remove this template\: <strong>${this.noteTemplate.title}</strong> ?`,
          confirmLabel: 'Remove',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (!confirmed) {
          return;
        }

        this.removing = true;
        this.noteService
          .removeNoteTemplate(this.noteTemplate.templateUuid)
          .subscribe(
            _ => {
              this.toastService.success('Remove successfully');
              this.reset();
            },
            err => this.toastService.warning(err.message)
          )
          .add(() => (this.removing = false));
      });
  }

  reset() {
    this.showNoteTemplateForm = false;
    this.initData();
  }

  save() {
    this.saving = true;

    const config: Partial<QueueConfig> = {
      agentWorkflowConfig: {
        ...this.queueConfig.agentWorkflowConfig,
        noteTemplateId: this.form.controls['noteTemplate'].value,
        script: this.form.get('script').value,
        disableNotes: this.form.get('disableNotes').value
      }
    };

    this.queueService
      .updateQueueConfig(this.data.uuid, config)
      .pipe(
        tap(queueConfig => {
          this.queueConfig = queueConfig;
        })
      )
      .subscribe(
        _ => {
          this.toastService.success(`Save note template successfully`);
          this.dialogRef.close();
        },
        err => this.toastService.warning(err.message)
      )
      .add(() => (this.saving = false));
  }

  toggleNoteTemplateForm() {
    this.showNoteTemplateForm = !this.showNoteTemplateForm;
  }
}
