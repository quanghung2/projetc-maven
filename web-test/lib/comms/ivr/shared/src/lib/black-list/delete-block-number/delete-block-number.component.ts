import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BlacklistService } from 'libs/api/ivr/src/lib/blacklist/blacklist.service';
import { BlockedNumber } from 'libs/api/ivr/src/lib/blacklist/number-block';
import { finalize } from 'rxjs/operators';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'b3n-delete-block-number',
  templateUrl: './delete-block-number.component.html',
  styleUrls: ['./delete-block-number.component.scss']
})
export class DeleteBlockNumberComponent implements OnInit {
  progressing: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public blockedNumber: BlockedNumber,
    private blacklistService: BlacklistService,
    private dialogRef: MatDialogRef<DeleteBlockNumberComponent>,
    private toastService: ToastService
  ) {}

  ngOnInit() {}

  delete() {
    this.progressing = true;
    this.blacklistService
      .deleteBlockedNumbers(this.blockedNumber.workFlowUuid, this.blockedNumber.number)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        result => {
          this.toastService.success('Deleted number successfully!');
          this.dialogRef.close(result);
        },
        err => this.toastService.error('Cannot delete number. Please try later!')
      );
  }
}
