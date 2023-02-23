import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiKeyManagementService, CreateApiKeyReq } from '@b3networks/api/integration';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-store-api-key',
  templateUrl: './store-api-key.component.html',
  styleUrls: ['./store-api-key.component.scss']
})
export class StoreApiKeyComponent implements OnInit {
  name: string;
  progressing: boolean;

  constructor(
    private apiKeyService: ApiKeyManagementService,
    @Inject(MAT_DIALOG_DATA) private subUuid: string,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<StoreApiKeyComponent>
  ) {}

  ngOnInit(): void {
    console.log(this.subUuid);
  }

  create() {
    this.progressing = true;
    const req = {
      name: this.name,
      developerLicence: this.subUuid
    } as CreateApiKeyReq;
    this.apiKeyService
      .createApiKey(req)
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
}
