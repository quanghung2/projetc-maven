import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CampaignInfo, CampaignService } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-delete-number-list',
  templateUrl: './delete-number-list.component.html',
  styleUrls: ['./delete-number-list.component.scss']
})
export class DeleteNumberListComponent implements OnInit {
  isDeleting: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CampaignInfo,
    private campaignService: CampaignService,
    private toastService: ToastService,
    public dialogRef: MatDialogRef<DeleteNumberListComponent>
  ) {}

  ngOnInit() {}

  delete() {
    this.isDeleting = true;
    this.campaignService
      .deleteCampaign(this.data.uuid)
      .pipe(
        finalize(() => {
          this.isDeleting = false;
        })
      )
      .subscribe(
        () => {
          this.toastService.success('Deleted successfully!');
          this.dialogRef.close(this.data);
        },
        err => {
          this.toastService.error(err.message);
          this.dialogRef.close(false);
        }
      );
  }
}
