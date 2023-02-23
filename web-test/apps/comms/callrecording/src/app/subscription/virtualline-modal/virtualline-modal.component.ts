import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { ModalComponent } from '../../app-modal/modal.component';
import { CRSubscription, SubscriptionService } from '../../shared';

declare let jQuery: any;

@Component({
  selector: 'app-virtualline-modal',
  templateUrl: './virtualline-modal.component.html',
  styleUrls: ['./virtualline-modal.component.css'],
  host: {
    class: 'ui setting modal'
  }
})
export class VirtuallineModalComponent implements OnInit, AfterViewInit {
  @Output() action = new EventEmitter<any>();
  @ViewChild('contentElement') contentElement: ElementRef;

  public subscription: CRSubscription;
  public config: any;
  public currentExtensions = [];
  public checkRecordAll = false;
  public playMessageConfig = {};

  public isAppV2 = false;
  public enableCallRecording = false;

  constructor(private subscriptionService: SubscriptionService, private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit() {}

  ngAfterViewInit() {
    jQuery(this.contentElement.nativeElement).accordion({
      selector: {
        trigger: '.title .header'
      }
    });

    this.getConfig();
  }

  getConfig() {
    if (this.subscription.assignedConfig && this.subscription.assignedConfig.isAppV2) {
      this.isAppV2 = true;
    } else {
      this.isAppV2 = false;
    }

    if (this.subscription.assignedConfig != undefined) {
      return this.updateConfig(this.subscription.assignedConfig);
    }

    try {
      this.subscriptionService.getConfig(this.subscription).then(config => this.updateConfig(config));
    } catch (error) {
      this.config = {
        message: 'Error occurred, un-assign and re-assign again, please!'
      };
    }
  }

  updateConfig(config) {
    this.config = config;

    if (this.isAppV2) {
      this.enableCallRecording = this.config.enableCallRecording;
    } else {
      this.currentExtensions = this.config.incomings.OFFICE_HOURS.extensions;

      // detect record all
      this.onCheckRecordAll();
    }
    this.changeDetectorRef.detectChanges();

    ModalComponent.on('refresh');
  }

  setConfig(config) {
    this.subscriptionService.setConfig(this.subscription, config);
  }

  onCheckRecordAll(checked?) {
    const rootMonitors = [
      this.config.incomings.OFFICE_HOURS,
      this.config.incomings.AFTER_OFFICE_HOURS,
      this.config.incomings.PUBLIC_HOLIDAY
    ];

    const monitors = [].concat(rootMonitors);
    for (let i = 0; i < monitors.length; i++) {
      const monitor = monitors[i];
      if (monitor.extensions != undefined && monitor.extensions.length > 0) {
        monitor.extensions.forEach(ext => {
          ext.parent = monitor;
          monitors.push(ext);
        });
      }
    }

    // this.playMessageConfig
    try {
      const config = JSON.parse(JSON.stringify(this.config.incomings.OFFICE_HOURS.ivrMsgConf));
      config.isPlayMessage = (config.message != undefined && config.message.length > 0) || config.mp3Url != undefined;
      if (config.playType == 'MP3') {
        config.mp3Url = config.message;
        delete config.message;
      }
      this.playMessageConfig = config;
    } catch (e) {}

    if (checked == undefined) {
      // detect record all
      if (rootMonitors.filter(monitor => monitor.needMonitor != 'RECORD_ALL').length > 0) {
        this.checkRecordAll = false;
      } else {
        this.checkRecordAll = true;
      }
    } else {
      this.checkRecordAll = checked;

      const type = this.checkRecordAll ? 'RECORD_ALL' : 'UNRECORD';
      monitors.forEach(monitor => (monitor.needMonitor = type));
    }

    this.changeDetectorRef.detectChanges();
  }

  activeExtensions(event, config) {
    jQuery(event.target).parent().find('.item').removeClass('active');
    jQuery(event.target).addClass('active');

    this.currentExtensions = config.extensions;
  }

  toggleRecord(extension, checked: boolean, autoDown: boolean = false, autoUp: boolean = false) {
    if (autoUp) {
      if (this.countExtensionRecording(extension.extensions) > 0) {
        extension.needMonitor = 'RECORD_SPECIFIC';
      } else {
        extension.needMonitor = 'UNRECORD';
      }
    } else {
      if (checked) {
        extension.needMonitor = 'RECORD_ALL';
      } else {
        extension.needMonitor = 'UNRECORD';
      }
    }

    if (!autoUp && extension.extensions != undefined && extension.extensions.length > 0) {
      extension.extensions.forEach(ext => this.toggleRecord(ext, false, true, false));
    }

    if (!autoDown && extension.parent != undefined) {
      this.toggleRecord(extension.parent, extension.needMonitor != 'UNRECORD', false, true);
    }
    this.changeDetectorRef.detectChanges();
  }

  countExtensionRecording(extensions) {
    let count = 0;
    extensions.forEach(extension => {
      if (['RECORD_ALL', 'RECORD_SPECIFIC'].indexOf(extension.needMonitor) >= 0) {
        count += 1;
      }
      if (extension.extensions != undefined) {
        count += this.countExtensionRecording(extension.extensions);
      }
    });
    return count;
  }

  onSave(event) {
    if (this.playMessageConfig['playType'] == 'MP3') {
      this.playMessageConfig['message'] = this.playMessageConfig['mp3Url'];
      delete this.playMessageConfig['mp3Url'];
    }
    if (!this.playMessageConfig['isPlayMessage']) {
      delete this.playMessageConfig['message'];
    }
    delete this.playMessageConfig['isPlayMessage'];

    // clean config
    const monitors = [
      this.config.incomings.OFFICE_HOURS,
      this.config.incomings.AFTER_OFFICE_HOURS,
      this.config.incomings.PUBLIC_HOLIDAY
    ];
    for (let i = 0; i < monitors.length; i++) {
      const monitor = monitors[i];
      if (monitor.extensions != undefined && monitor.extensions.length > 0) {
        monitor.extensions.forEach(ext => {
          delete ext.parent;
          monitors.push(ext);
        });
      }
    }

    const config = JSON.parse(JSON.stringify(this.config));
    const incomings = config.incomings;

    incomings.OFFICE_HOURS.ivrMsgConf =
      incomings.AFTER_OFFICE_HOURS.ivrMsgConf =
      incomings.PUBLIC_HOLIDAY.ivrMsgConf =
        this.playMessageConfig;

    this.setConfig(config);
    this.action.emit({
      name: 'refresh'
    });
  }

  saveV2() {
    this.config.enableCallRecording = this.enableCallRecording;

    const config = JSON.parse(JSON.stringify(this.config));
    this.setConfig(config);
    this.action.emit({
      name: 'refresh'
    });
  }

  updateEnableCallRecording() {
    this.enableCallRecording = !this.enableCallRecording;
  }
}
