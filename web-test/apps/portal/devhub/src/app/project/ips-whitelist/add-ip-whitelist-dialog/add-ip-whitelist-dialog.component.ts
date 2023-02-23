import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ApiKeyManagementService, ApiKeyQuery, IpsWhitelistService, IPWhiteList } from '@b3networks/api/integration';
import { ToastService } from '@b3networks/shared/ui/toast';
import { MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-add-ip-whitelist-dialog',
  templateUrl: './add-ip-whitelist-dialog.component.html',
  styleUrls: ['./add-ip-whitelist-dialog.component.scss']
})
export class AddIpWhitelistDialogComponent implements OnInit {
  progressing: boolean;
  ipAddress: string;

  constructor(
    private ipWhitelistService: IpsWhitelistService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<AddIpWhitelistDialogComponent>,
    private apiKeyService: ApiKeyManagementService,
    private apiKeyQuery: ApiKeyQuery
  ) {}

  ngOnInit(): void {}

  add() {
    this.progressing = true;
    const apiKeyId = this.apiKeyQuery.getValue()?.apiKey?.id;
    const address = encodeURIComponent(this.ipAddress);
    console.log(apiKeyId, address);

    this.apiKeyService
      .addSingleIpToWhiteList(apiKeyId, address)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.dialogRef.close({ ok: true });
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }
}
