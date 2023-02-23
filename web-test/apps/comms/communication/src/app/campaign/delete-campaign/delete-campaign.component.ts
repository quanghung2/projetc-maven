import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CampaignInfo, CampaignLicenseService, CampaignService } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-delete-campaign',
  templateUrl: './delete-campaign.component.html',
  styleUrls: ['./delete-campaign.component.scss']
})
export class DeleteCampaignComponent implements OnInit {
  isDeleting = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { campaign: CampaignInfo; isFlow: boolean },
    private campaignService: CampaignService,
    private campaignLicenseService: CampaignLicenseService,
    private toastService: ToastService,
    public dialogRef: MatDialogRef<DeleteCampaignComponent>
  ) {}

  ngOnInit() {}

  delete() {
    this.isDeleting = true;
    (this.data.isFlow
      ? this.campaignLicenseService.deleteCampaignV2(this.data.campaign.uuid)
      : this.campaignService.deleteCampaign(this.data.campaign.uuid)
    )
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
