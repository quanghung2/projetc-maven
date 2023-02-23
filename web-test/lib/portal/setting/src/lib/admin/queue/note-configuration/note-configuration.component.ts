import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { KeyValue } from '@angular/common';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  AgentWorkflowConfig,
  DetailCustomField,
  QueueConfig,
  QueueInfo,
  QueueService,
  TypeCustomField
} from '@b3networks/api/callcenter';
import { ConfirmDialogComponent } from '@b3networks/shared/ui/confirm-dialog';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { delay, finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-note-configuration',
  templateUrl: './note-configuration.component.html',
  styleUrls: ['./note-configuration.component.scss']
})
export class NoteConfigurationComponent implements OnInit {
  @ViewChild('codeOption') codeOption: ElementRef;

  loading: boolean;
  saving = false;
  queue: QueueConfig;
  customFields: DetailCustomField[] = [];
  isPositionMode = true;
  isShowDespositionCode: boolean;
  typeSelect: TypeCustomField;

  readonly TypeCustomField = TypeCustomField;
  readonly types: KeyValue<TypeCustomField, string>[] = [
    { key: TypeCustomField.textField, value: 'Text Field' },
    // { key: TypeCustomField.numberField, value: 'Number Field' },
    { key: TypeCustomField.singleChoiceField, value: 'Single Choice Field' },
    { key: TypeCustomField.multipleChoiceField, value: 'Multiple Choice Field' }
  ];

  get isDisableSave() {
    return !this.isShowDespositionCode && this.customFields.length === 0;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: QueueInfo,
    private queueService: QueueService,
    private spinnerService: LoadingSpinnerSerivce,
    public dialogRef: MatDialogRef<NoteConfigurationComponent>,
    private toastService: ToastService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  reload() {
    this.loading = true;

    this.queueService
      .getQueueConfig(this.data.uuid)
      .pipe(
        delay(400),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        queueConfig => {
          this.queue = queueConfig;
          this.customFields = this.queue.customFields || [];
          this.isShowDespositionCode = this.customFields.length === 0;
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  save() {
    if (this.isShowDespositionCode) {
      this.dialog
        .open(ConfirmDialogComponent, {
          autoFocus: false,
          minWidth: `400px`,
          data: {
            message: `Custom field data will be lost. Are you sure to save changes?`,
            title: `Confirm`
          }
        })
        .afterClosed()
        .subscribe(confirmed => {
          if (confirmed) {
            this.updateQueue();
          }
        });
    } else {
      this.updateQueue();
    }
  }

  updateQueue() {
    this.saving = true;
    this.queue.customFields = this.isShowDespositionCode ? [] : this.customFields;
    const config = {
      customFields: this.isShowDespositionCode ? [] : this.customFields,
      agentWorkflowConfig: {
        codeOptions: this.queue.agentWorkflowConfig.codeOptions
      } as AgentWorkflowConfig
    } as QueueConfig;

    this.queueService
      .updateQueueConfig(this.data.uuid, config)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        queue => {
          this.dialogRef.close(Object.assign(new QueueConfig(), queue));
          this.toastService.success('Agent management has been updated.');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  onChangeView() {
    this.isShowDespositionCode = !this.isShowDespositionCode;
  }

  addCodeOption(codeOption: string) {
    this.codeOption.nativeElement.value = '';
    if (codeOption === '') {
      return;
    }

    if (!this.queue.agentWorkflowConfig || !this.queue.agentWorkflowConfig.codeOptions) {
      return;
    }

    if (this.queue.agentWorkflowConfig.codeOptions.includes(codeOption)) {
      return;
    }

    this.queue.agentWorkflowConfig.codeOptions.push(codeOption);
  }

  deleteCodeOption(codeOption: string) {
    if (!this.queue.agentWorkflowConfig || !this.queue.agentWorkflowConfig.codeOptions) {
      return;
    }

    this.queue.agentWorkflowConfig.codeOptions.splice(
      this.queue.agentWorkflowConfig.codeOptions.indexOf(codeOption),
      1
    );
  }

  dropDispositionCodes(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.queue.agentWorkflowConfig.codeOptions, event.previousIndex, event.currentIndex);
  }

  editChanged(event: { index: number; value: string }) {
    this.customFields[event.index].key = event.value;
  }

  dropCustomFields(event: CdkDragDrop<DetailCustomField[]>) {
    moveItemInArray(this.customFields, event.previousIndex, event.currentIndex);
  }

  onDeleteField(index: number) {
    this.customFields.splice(index, 1);
  }

  addMoreCustomField($event: DetailCustomField) {
    this.customFields.unshift($event);
    this.typeSelect = null;
  }
}
