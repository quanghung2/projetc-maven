import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import {
  AddressOfRecordMode,
  DirectRoutingOrg,
  DirectRoutingReq,
  LicenseDirectRoutingService
} from '@b3networks/api/license';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

export enum anynodeStatus {
  created = 'created'
}

@Component({
  selector: 'b3n-check-provision',
  templateUrl: './check-provision.component.html',
  styleUrls: ['./check-provision.component.scss']
})
export class CheckProvisionComponent implements OnInit {
  directRouting: DirectRoutingOrg;
  addressOfRecordMode: AddressOfRecordMode;
  enabledDirectRouting: boolean;
  isLoading = true;

  readonly anynodeStatus = anynodeStatus;

  constructor(
    private licenseDirectRoutingService: LicenseDirectRoutingService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<CheckProvisionComponent>
  ) {}

  ngOnInit(): void {
    this.licenseDirectRoutingService.getDirectRoutingOrg().subscribe(res => {
      this.directRouting = res;
      this.enabledDirectRouting = res.anynodeInfo.addressOfRecordMode ? true : false;

      if (!this.enabledDirectRouting) {
        this.licenseDirectRoutingService
          .getExtMapping()
          .pipe(
            finalize(() => {
              this.isLoading = false;
            })
          )
          .subscribe(exts => {
            this.enabledDirectRouting = exts.find(e => e.anynodeInfo.status === anynodeStatus.created) ? true : false;
          });
      } else {
        this.isLoading = false;
      }
    });
  }

  enableDirectRouting() {
    if (this.enabledDirectRouting) {
      this.dialogRef.close(true);
    } else {
      let body = <DirectRoutingReq>{
        addressOfRecordMode: this.addressOfRecordMode,
        anyNodeDomain: this.directRouting.anyNodeDomain,
        dnsTxtRecordValue: this.directRouting.dnsTxtRecordValue
      };
      this.licenseDirectRoutingService.updateDirectRouting(body).subscribe(
        _ => {
          this.dialogRef.close(true);
        },
        error => {
          this.toastService.error(error.message);
        }
      );
    }
  }
}
