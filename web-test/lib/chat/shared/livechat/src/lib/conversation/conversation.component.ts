import { Component, HostListener, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConversationGroup, HistoryMessageQuery } from '@b3networks/api/workspace';
import { UploadDialogComponent, UploadDialogInput } from '@b3networks/chat/shared/core';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'csl-conversation',
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

  uploadFile(models: File[], index: number) {
    this.dialog
      .open(UploadDialogComponent, {
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
            this.uploadFile(models, index);
          }
        },
        err => {
          // next
          index = index + 1;
          if (index < models.length) {
            this.uploadFile(models, index);
          }
        }
      );
  }

  private uploadMultipleFiles(files: File[]) {
    if (!files || files.length === 0) {
      return;
    }
    if (files.length > 0) {
      this.uploadFile(files, 0);
    }
  }
}
