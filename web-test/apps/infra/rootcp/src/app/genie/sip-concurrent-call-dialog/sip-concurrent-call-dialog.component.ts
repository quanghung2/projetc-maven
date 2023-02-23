import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { OtherService, SipConcurrentCall } from '@b3networks/api/cp';
import { ToastService } from '@b3networks/shared/ui/toast';
import { of } from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';

@Component({
  selector: 'b3n-sip-concurrent-call-dialog',
  templateUrl: './sip-concurrent-call-dialog.component.html',
  styleUrls: ['./sip-concurrent-call-dialog.component.scss']
})
export class SipConcurrentCallDialogComponent implements OnInit {
  sipUsername: string;
  concurrentCall: number;
  formSipUsername: UntypedFormControl = new UntypedFormControl('');
  constructor(
    private dialogRef: MatDialogRef<SipConcurrentCallDialogComponent>,
    private otherService: OtherService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.formSipUsername.valueChanges
      .pipe(
        debounceTime(500),
        switchMap(value => this.otherService.getConcurrentCall(value).pipe(catchError(() => of(null))))
      )
      .subscribe(res => {
        if (res) {
          this.concurrentCall = res.concurrentCallLimit;
        }
      });
  }

  updateConcurrentCall() {
    const body = {
      sipUsername: this.formSipUsername.value,
      action: 'updateConcurrentCall',
      data: {
        concurrentCall: this.concurrentCall
      }
    } as SipConcurrentCall;
    this.otherService.updateConcurrentCall(body).subscribe(
      res => {
        this.toastService.success('Change concurrent call successfully');
        this.dialogRef.close();
      },
      err => this.toastService.error(err.message)
    );
  }
}
