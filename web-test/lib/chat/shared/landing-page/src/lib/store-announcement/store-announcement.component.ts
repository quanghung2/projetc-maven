import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  AnnouncementResp,
  AnnouncementService,
  PostCreateAnnouncementReq,
  PutUpdateAnnouncementReq
} from '@b3networks/api/portal';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-store-announcement',
  templateUrl: './store-announcement.component.html',
  styleUrls: ['./store-announcement.component.scss']
})
export class StoreAnnouncementComponent implements OnInit {
  announcementTitle: string;
  announcementContent: string;
  progressing: boolean;
  selectedStatus: 'ACTIVE' | 'DISABLED' = 'ACTIVE';
  titleFocused: boolean;
  contentFocused: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public announcenment: AnnouncementResp,
    private announcementService: AnnouncementService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<StoreAnnouncementComponent>
  ) {
    if (announcenment) {
      this.announcementTitle = announcenment.title;
      this.announcementContent = announcenment.content;
    }
  }

  ngOnInit(): void {}

  save() {
    this.announcenment ? this.update() : this.create();
  }

  create() {
    this.progressing = true;
    const req = {
      title: this.announcementTitle,
      content: this.announcementContent
    } as PostCreateAnnouncementReq;

    this.announcementService
      .create(req)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.dialogRef.close({ ok: true });
          this.toastService.success('Created successfully');
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  update() {
    this.progressing = true;
    const req = {
      title: this.announcementTitle,
      content: this.announcementContent,
      status: this.selectedStatus
    } as PutUpdateAnnouncementReq;

    this.announcementService.update(this.announcenment.id, req).subscribe(
      _ => {
        this.dialogRef.close({ ok: true });
        this.toastService.success('Updated successfully');
      },
      error => {
        this.toastService.error(error.message);
      }
    );
  }

  titleFocusChanged(event: FocusEvent) {
    this.titleFocused = event.type === 'focus' ? true : false;
  }

  contentFocusChanged(event: FocusEvent) {
    this.contentFocused = event.type === 'focus' ? true : false;
  }
}
