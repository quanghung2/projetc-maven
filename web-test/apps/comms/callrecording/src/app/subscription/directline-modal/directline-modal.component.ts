import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ModalComponent } from '../../app-modal/modal.component';
import { CRSubscription, Merge, SubscriptionService } from '../../shared';
import { SettingConfigComponent } from '../setting-config/setting-config.component';

@Component({
  selector: 'app-directline-modal',
  templateUrl: './directline-modal.component.html',
  styleUrls: ['./directline-modal.component.css'],
  host: {
    class: 'ui setting modal'
  }
})
export class DirectlineModalComponent implements OnInit {
  @Output() action = new EventEmitter<any>();

  public subscription: CRSubscription;
  public config: any;
  public playMessageConfig: any = {};

  constructor(private subscriptionService: SubscriptionService, private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.getConfig();
  }

  getConfig() {
    if (this.subscription.assignedConfig != undefined) {
      return this.updateConfig(this.subscription.assignedConfig);
    }

    this.subscriptionService.getConfig(this.subscription).then(config => this.updateConfig(config));
  }

  updateConfig(config) {
    this.config = config;

    let cfg: any = {};
    cfg.msg = this.config.recordMessage;
    cfg.isRecord = this.config.isMonitor;
    cfg = SettingConfigComponent.parseFromConfig(cfg);

    Merge.putAll(this.playMessageConfig, cfg);
    console.log(this.playMessageConfig, cfg, this.config);

    this.changeDetectorRef.detectChanges();
    ModalComponent.on('refresh');
  }

  setConfig(config) {
    this.subscriptionService.setConfig(this.subscription, config);
  }

  onSave(event) {
    let config = SettingConfigComponent.parseToConfig(this.playMessageConfig);

    this.config.recordMessage = config.msg;
    this.config.isMonitor = config.isRecord;

    if (!this.playMessageConfig.isPlayMessage) {
      delete this.config.recordMessage;
    }

    this.setConfig(this.config);

    this.action.emit({
      name: 'refresh'
    });
  }
}
