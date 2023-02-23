import { Component, HostListener, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConversationGroup, HistoryMessageQuery } from '@b3networks/api/workspace';
import { UploadDialogInput, UploadDialogV2Component } from '@b3networks/chat/shared/core';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'csw-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.scss']
})
export class ConversationComponent extends DestroySubscriberComponent implements OnInit {
  isLoading$: Observable<boolean>;

  @Input() ticket: ConversationGroup;

  @HostListener('dragover', ['$event']) onDragOver(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  @HostListener('drop', ['$event']) onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const files = Array.from(event.dataTransfer.files) as File[];
    this.uploadMultipleFiles(files);
  }

  constructor(private messageQuery: HistoryMessageQuery, public dialog: MatDialog) {
    super();
  }

  ngOnInit() {
    this.isLoading$ = this.messageQuery.isLoading$;
  }

  uploadFileV2(models: File[], index: number) {
    this.dialog
      .open(UploadDialogV2Component, {
        width: '500px',
        disableClose: true,
        data: <UploadDialogInput>{
          file: models[index],
          ticket: this.ticket,
          index: index + 1,
          max: models.length
        }
      })
      .afterClosed()
      .subscribe(
        _ => {
          // next
          index = index + 1;
          if (index < models.length) {
            this.uploadFileV2(models, index);
          }
        },
        err => {
          // next
          index = index + 1;
          if (index < models.length) {
            this.uploadFileV2(models, index);
          }
        }
      );
  }

  private uploadMultipleFiles(files: File[]) {
    if (!files || files.length === 0) {
      return;
    }
    if (files.length > 0) {
      this.uploadFileV2(files, 0);
    }
  }
}
