import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { ModalComponent } from '../../app-modal/modal.component';
import { CRSubscription, Merge, SubscriptionService } from '../../shared';
import { SettingConfigComponent } from '../setting-config/setting-config.component';

declare var jQuery: any;

@Component({
  selector: 'app-sip-modal',
  templateUrl: './sip-modal.component.html',
  styleUrls: ['./sip-modal.component.css'],
  host: {
    class: 'ui setting modal'
  }
})
export class SipModalComponent implements OnInit {
  @Output() action = new EventEmitter<any>();
  @ViewChild('contentElement', { static: true }) contentElement: ElementRef;

  public subscription: CRSubscription;
  public config: any;
  public inboundConfig: any = {};
  public outboundConfig: any = {};

  constructor(private subscriptionService: SubscriptionService, private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.getConfig();
  }

  loadAccordion() {
    jQuery(this.contentElement.nativeElement)
      .find('.ui.accordion:first')
      .accordion({
        selector: {
          trigger: '.title .header'
        }
      });
  }

  getConfig() {
    if (this.subscription.assignedConfig != undefined) {
      return this.updateConfig(this.subscription.assignedConfig);
    }

    this.subscriptionService.getConfig(this.subscription).then(config => this.updateConfig(config));
  }

  updateConfig(config) {
    Merge.putAll(this.inboundConfig, SettingConfigComponent.parseFromConfig(config.incoming));
    Merge.putAll(this.outboundConfig, SettingConfigComponent.parseFromConfig(config.outgoing));

    this.config = config;
    this.changeDetectorRef.detectChanges();
    this.loadAccordion();
    ModalComponent.on('refresh');
  }

  setConfig(config) {
    this.subscriptionService.setConfig(this.subscription, config);
  }

  onSave(event) {
    let config: any = {};
    config.incoming = SettingConfigComponent.parseToConfig(this.inboundConfig);
    delete config.incoming.isRecord;

    config.outgoing = SettingConfigComponent.parseToConfig(this.outboundConfig);
    delete config.outgoing.isRecord;

    if (config.incoming.msg == null) {
      config.incoming.msg = '';
    }
    if (config.outgoing.msg == null) {
      config.outgoing.msg = '';
    }

    this.setConfig(config);
    this.action.emit({
      name: 'refresh'
    });
  }
}
