import { Component, OnInit } from '@angular/core';
import { CallFlow, CallflowService, NotificationSetting, Setting, SettingsService } from '@b3networks/api/ivr';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';

@Component({
  selector: 'b3n-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  flow: CallFlow;
  setting: NotificationSetting;
  settings: Setting[] = [];
  loading: boolean;

  constructor(
    private spinner: LoadingSpinnerSerivce,
    private flowService: CallflowService,
    private settingsService: SettingsService
  ) {}

  ngOnInit() {
    if (this.loading) {
      return;
    }
    this.spinner.showSpinner();
    this.loading = true;
    // this.route.params
    //   .pipe(
    //     switchMap(params => {
    //       return forkJoin(
    //         this.flowService.getFlow(params['uuid']),
    //         this.settingsService.fetchSettings(params['uuid'])
    //       );
    //     })
    //   )
    //   .subscribe(data => {
    //     this.flow = data[0];
    //     this.setting = data[1].settings[0];
    //     this.onRefreshSettings(data[1]);
    //     this.loading = false;
    //     this.spinner.hideSpinner();
    //   });
  }

  onRefreshSettings(data: any) {
    this.settings = data.settings;
  }
}
