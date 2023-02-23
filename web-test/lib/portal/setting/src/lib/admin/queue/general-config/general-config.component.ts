import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { OrgConfig, OrgConfigQuery, OrgConfigService, PopupConfig, PopupShowedOn } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-general-config',
  templateUrl: './general-config.component.html',
  styleUrls: ['./general-config.component.scss']
})
export class GeneralConfigComponent extends DestroySubscriberComponent implements OnInit {
  readonly popups: KeyValue<PopupShowedOn, string>[] = [
    { key: PopupShowedOn.none, value: 'None' },
    { key: PopupShowedOn.app, value: 'Desktop application' }
  ];

  loading: boolean;
  popupConfig: PopupConfig;
  wrapupTime: number;
  currentShowOn: PopupShowedOn;
  progressing: boolean;

  constructor(
    private orgConfigQuery: OrgConfigQuery,
    private orgConfigService: OrgConfigService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<GeneralConfigComponent>
  ) {
    super();
  }

  ngOnInit(): void {
    this.orgConfigQuery.selectLoading().subscribe(loading => {
      loading ? (this.loading = true) : (this.loading = false);
    });

    this.orgConfigQuery.orgConfig$.pipe(takeUntil(this.destroySubscriber$)).subscribe(config => {
      this.popupConfig = new PopupConfig(config.popupConfig);
      this.currentShowOn = config.popupConfig ? config.popupConfig.defaultPopupShowedOn : null;
      this.wrapupTime = config.defaultWrapUpTimeInSeconds;
    });
  }

  update() {
    this.progressing = true;
    const orgConfig = new OrgConfig();
    orgConfig.popupConfig = this.popupConfig;
    orgConfig.defaultWrapUpTimeInSeconds = this.wrapupTime;

    this.orgConfigService
      .updateConfig(orgConfig)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          let message = `Your configuration has been updated`;
          if (this.currentShowOn !== orgConfig.popupConfig.defaultPopupShowedOn) {
            message += ` This change needs your agents to log out and log in`;
          }

          this.dialogRef.close();
          this.toastService.success(message + '.');
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }
}
