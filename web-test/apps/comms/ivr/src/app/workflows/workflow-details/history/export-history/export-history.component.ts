import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, Inject, OnInit } from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExportRequest, HistoryService } from '@b3networks/api/ivr';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { ExportHistoryDialogData } from '../history.component';

@Component({
  selector: 'b3n-export-history',
  templateUrl: './export-history.component.html',
  styleUrls: ['./export-history.component.scss']
})
export class ExportHistoryComponent implements OnInit {
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  emails: string[] = [];
  exporting: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ExportHistoryDialogData,
    private historyService: HistoryService,
    private dialogRef: MatDialogRef<ExportHistoryComponent>,
    private spinner: LoadingSpinnerSerivce,
    private toastMessage: ToastService
  ) {
    const date = new Date(data.to);
    date.setDate(date.getDate() + 1);
    data.to = Number(date);
  }

  ngOnInit() {}

  remove(email: string) {
    const index = this.emails.indexOf(email);

    if (index >= 0) {
      this.emails.splice(index, 1);
    }
  }

  add(event: MatChipInputEvent) {
    const input = event.input;
    const value = event.value;

    // Add our fruit
    if ((value || '').trim()) {
      this.emails.push(value);
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  export() {
    this.exporting = true;
    this.spinner.showSpinner();
    const exportHistoryData = <ExportRequest>{
      from: this.data.from,
      to: this.data.to,
      workFlowUuid: this.data.workFlowUuid,
      emails: this.emails,
      query: this.data.query
    };
    this.historyService
      .export(exportHistoryData)
      .pipe(
        finalize(() => {
          this.exporting = false;
          this.spinner.hideSpinner();
        })
      )
      .subscribe(
        result => {
          this.toastMessage.success(
            `Your export request is being processed. It may take several minutes to generated. Once completed, the csv file will be sent to you via email: ${
              this.emails.length > 0 ? this.emails.join(', ') : this.data.email
            }`,
            7000
          );
          this.dialogRef.close(result);
        },
        () =>
          this.toastMessage.error(
            `Sorry, an error has occurred when we try to fulfill your request. Please try again in a few minutes.`
          )
      );
  }
}
