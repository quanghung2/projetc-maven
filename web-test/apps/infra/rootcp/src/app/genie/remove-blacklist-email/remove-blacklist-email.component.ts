import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { BlacklistService } from '@b3networks/api/cp';
import { MyErrorStateMatcher } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs';

@Component({
  selector: 'b3n-remove-blacklist-email',
  templateUrl: './remove-blacklist-email.component.html',
  styleUrls: ['./remove-blacklist-email.component.scss']
})
export class RemoveBlacklistEmailComponent implements OnInit {
  processing: boolean;
  formGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });
  matcher = new MyErrorStateMatcher();
  get email() {
    return this.formGroup.get('email');
  }
  constructor(
    private fb: UntypedFormBuilder,
    private dialogRef: MatDialogRef<RemoveBlacklistEmailComponent>,
    private toastService: ToastService,
    private blacklistService: BlacklistService
  ) {}

  ngOnInit(): void {}

  save() {
    this.processing = true;
    const req = [this.email.value];
    this.blacklistService
      .deleteBlacklist(req)
      .pipe(finalize(() => (this.processing = false)))
      .subscribe(
        _ => {
          this.dialogRef.close();
          this.toastService.success('update successfully');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
