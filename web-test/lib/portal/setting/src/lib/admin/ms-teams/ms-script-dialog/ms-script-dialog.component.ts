import { Component, OnInit } from '@angular/core';
import { ToastService } from '@b3networks/shared/ui/toast';
import { MatDialogRef } from '@angular/material/dialog';
import { MsTeamCallCenterService } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-ms-script-dialog',
  templateUrl: './ms-script-dialog.component.html',
  styleUrls: ['./ms-script-dialog.component.scss']
})
export class MsScriptDialogComponent extends DestroySubscriberComponent implements OnInit {
  powerShellScript: string;

  constructor(
    private toastService: ToastService,
    private msTeamCallCenterService: MsTeamCallCenterService,
    public dialogRef: MatDialogRef<MsScriptDialogComponent>,
  ) {
    super();
  }

  copyScript() {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = this.powerShellScript;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    this.toastService.success('Script copied');
  }

  ngOnInit() {
    this.generatePowershell()
  }

  generatePowershell() {
    this.msTeamCallCenterService
      .generatePowerShell()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe((powerShellScript: any) => {
        this.powerShellScript = powerShellScript;
      });
  }
}
