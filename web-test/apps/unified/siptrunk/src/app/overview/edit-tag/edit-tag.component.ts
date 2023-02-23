import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SipAccount, SipTrunkService } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

export interface EditTagInput {
  sip: SipAccount;
}

@Component({
  selector: 'b3n-edit-tag',
  templateUrl: './edit-tag.component.html',
  styleUrls: ['./edit-tag.component.scss']
})
export class EditTagComponent implements OnInit {
  processing: boolean;
  label: string;

  constructor(
    private sipTrunkService: SipTrunkService,
    private toastService: ToastService,
    @Inject(MAT_DIALOG_DATA) public data: EditTagInput,
    private dialogRef: MatDialogRef<EditTagComponent>
  ) {
    this.label = this.data.sip?.detail?.label;
  }

  ngOnInit() {}

  submit() {
    this.processing = true;
    this.sipTrunkService
      .updateLabel(this.data.sip.sipUsername, this.label)
      .pipe(finalize(() => (this.processing = false)))
      .subscribe(
        _ => {
          this.dialogRef.close(true);
        },
        err => {
          try {
            const json = JSON.parse(err);
            this.toastService.error(json.message);
          } catch (error) {}
        }
      );
  }
}
