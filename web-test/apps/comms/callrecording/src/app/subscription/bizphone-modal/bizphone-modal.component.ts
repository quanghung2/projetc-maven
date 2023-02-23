import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { ModalComponent } from '../../app-modal/modal.component';
import { CRSubscription, SubscriptionService } from '../../shared';

declare var jQuery: any;

@Component({
  selector: 'app-bizphone-modal',
  templateUrl: './bizphone-modal.component.html',
  styleUrls: ['./bizphone-modal.component.css'],
  host: {
    class: 'ui setting modal'
  }
})
export class BizphoneModalComponent implements OnInit {
  @Output() action = new EventEmitter<any>();
  @ViewChild('inputElement') inputElement: ElementRef;

  public subscription: CRSubscription;
  public configs: any;

  constructor(private subscriptionService: SubscriptionService, private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.getConfig();
  }

  loadDropdown() {
    if (this.inputElement == undefined) {
      return;
    }
    jQuery(this.inputElement.nativeElement).dropdown({
      match: 'text',
      onChange: value => {
        if (!this.canRecordMoreConfig()) {
          return;
        }
        for (let idx in this.configs) {
          let config = this.configs[idx];
          if (config.extensionKey == value) {
            config.isRecording = true;
            this.changeDetectorRef.detectChanges();
            return;
          }
        }
      }
    });
  }

  getConfig() {
    this.subscriptionService.getConfig(this.subscription).then(config => this.updateConfig(config));
  }

  setConfig(config) {
    this.subscriptionService.setConfig(this.subscription, config);
  }

  updateConfig(configs) {
    this.configs = configs;

    this.changeDetectorRef.detectChanges();
    ModalComponent.on('refresh');

    this.loadDropdown();
  }

  canRecordMoreConfig() {
    let configs = this.configs.filter(config => config.isRecording);
    return configs.length < this.subscription.plan.numOfConcurrentCall;
  }

  onSave() {
    this.configs.forEach(config => {
      if (config.isRecording && config.display == undefined) {
        config.display = `${config.extensionKey} - ${config.label}`;
      } else {
        delete config.display;
      }
    });
    this.setConfig(JSON.parse(JSON.stringify(this.configs)));

    this.action.emit({
      name: 'refresh'
    });
  }
}
