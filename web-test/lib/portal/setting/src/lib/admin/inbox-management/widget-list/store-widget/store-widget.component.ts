import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inbox, StoreWidgetRequest, Widget, WidgetService } from '@b3networks/api/inbox';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs';

export interface StoreWidgetData {
  isCreate: boolean;
  widget: Widget;
  inbox: Inbox;
}

@Component({
  selector: 'b3n-store-widget',
  templateUrl: './store-widget.component.html',
  styleUrls: ['./store-widget.component.scss']
})
export class StoreWidgetComponent implements OnInit {
  loading = true;
  isProcessing: boolean;
  group = this.fb.group({
    name: ['', [Validators.required]]
  });

  get name() {
    return this.group.get('name');
  }

  constructor(
    public dialogRef: MatDialogRef<StoreWidgetComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StoreWidgetData,
    private fb: UntypedFormBuilder,
    private toastService: ToastService,
    private widgetService: WidgetService
  ) {}

  ngOnInit() {
    if (!this.data.isCreate) {
      this.loading = true;
      this.widgetService
        .getDetail(this.data.widget.uuid)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(widget => {
          this.group.setValue({
            name: widget?.name
          });
        });
    } else {
      this.loading = false;
    }
  }

  onSave() {
    if (this.data.isCreate) {
      this.isProcessing = true;
      this.widgetService
        .createWidget(<StoreWidgetRequest>{
          name: this.name.value,
          inboxUuid: this.data.inbox.uuid
        })
        .pipe(finalize(() => (this.isProcessing = false)))
        .subscribe(
          _ => {
            this.dialogRef.close();
            this.toastService.success('Create Successfully!');
          },
          err => {
            this.toastService.error(err.message);
          }
        );
    } else {
      this.isProcessing = true;
      this.widgetService
        .updateWidget(this.data.widget.uuid, <StoreWidgetRequest>{
          name: this.name.value,
          inboxUuid: this.data.inbox.uuid
        })
        .pipe(finalize(() => (this.isProcessing = false)))
        .subscribe(
          _ => {
            this.dialogRef.close();
            this.toastService.success('Update Successfully!');
          },
          err => {
            this.toastService.error(err.message);
          }
        );
    }
  }
}
