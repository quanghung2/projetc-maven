import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  OrgConfigQuery,
  OrgConfigService,
  PopupConfig,
  PopupField,
  PopupShowedOn,
  TxnType
} from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
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
    { key: PopupShowedOn.web, value: 'Web application' },
    { key: PopupShowedOn.app, value: 'Desktop application' },
    { key: PopupShowedOn.webNapp, value: 'Web and desktop application' }
  ];

  readonly types: KeyValue<TxnType, string>[] = [
    { key: TxnType.incoming, value: 'Call Center Inbound Calls' },
    { key: TxnType.autodialer, value: 'Call Center Outbound Calls' },
    { key: TxnType.callback, value: 'Call Center Scheduled Call Backs' },
    { key: TxnType.crossAppIn, value: 'Direct Inbound Calls' },
    { key: TxnType.crossApp, value: 'Direct Outbound Calls' }
  ];

  readonly PopupShowedOn = PopupShowedOn;

  popupConfig: PopupConfig;
  wrapupTime: number;
  smsPerCallerInDay: number;
  awayDetectionUnansweredThreshold: number;
  minimumRingTimeInSeconds: number;
  currentShowOn: PopupShowedOn;
  isAwayDetectionUnansweredThreshold: boolean;
  progressing: boolean;
  unreachableThreshold: number;
  isUnreachableThreshold: boolean;

  constructor(
    private orgConfigQuery: OrgConfigQuery,
    private orgConfigService: OrgConfigService,
    private toastService: ToastService,
    private spinner: LoadingSpinnerSerivce
  ) {
    super();
  }

  ngOnInit() {
    this.orgConfigQuery.selectLoading().subscribe(loading => {
      loading ? this.spinner.showSpinner() : this.spinner.hideSpinner();
    });

    this.orgConfigQuery.orgConfig$.pipe(takeUntil(this.destroySubscriber$)).subscribe(config => {
      this.popupConfig = new PopupConfig(config.popupConfig);
      this.currentShowOn = config.popupConfig ? config.popupConfig.defaultPopupShowedOn : null;
      this.wrapupTime = config.defaultWrapUpTimeInSeconds;
      this.smsPerCallerInDay = config.defaultSmsPerCallerInDay;
      this.awayDetectionUnansweredThreshold = config.awayDetectionUnansweredThreshold;
      this.isAwayDetectionUnansweredThreshold = !!config.awayDetectionUnansweredThreshold;
      this.minimumRingTimeInSeconds = config.minimumRingTimeInSeconds;
      this.unreachableThreshold = config.thresholdConfig.unreachableThreshold;
      this.isUnreachableThreshold =
        !!config.thresholdConfig.unreachableThreshold && config.thresholdConfig.unreachableThreshold !== -1;
    });

    this.orgConfigService.getConfig().subscribe();
  }

  addMoreField() {
    this.popupConfig.popupFields = this.popupConfig.popupFields || [];
    this.popupConfig.popupFields.push(new PopupField());
  }

  update() {
    this.progressing = true;
    const config = {
      popupConfig: this.popupConfig,
      defaultWrapUpTimeInSeconds: this.wrapupTime,
      defaultSmsPerCallerInDay: this.smsPerCallerInDay,
      awayDetectionUnansweredThreshold: this.isAwayDetectionUnansweredThreshold
        ? this.awayDetectionUnansweredThreshold
        : null,
      minimumRingTimeInSeconds: this.minimumRingTimeInSeconds,
      thresholdConfig: {
        unreachableThreshold: this.isUnreachableThreshold ? this.unreachableThreshold : -1
      }
    };
    this.orgConfigService
      .updateConfig(config)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          let message = `Popup config has been updated`;
          if (this.currentShowOn !== config.popupConfig.defaultPopupShowedOn) {
            message += ` This change needs your agents to log out and log in`;
          }

          this.toastService.success(message + '. This update will take effect after 5 minutes.');
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  toggleValue(value: boolean) {
    if (value && this.unreachableThreshold === -1) {
      this.unreachableThreshold = null;
    }
  }
}
