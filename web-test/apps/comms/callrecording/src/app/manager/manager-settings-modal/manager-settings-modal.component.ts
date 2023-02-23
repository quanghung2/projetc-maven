import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { ModalComponent } from '../../app-modal/modal.component';
import { ComplianceService } from '../../shared';

declare var jQuery: any;

@Component({
  selector: 'app-manager-settings-modal',
  templateUrl: './manager-settings-modal.component.html',
  styleUrls: ['./manager-settings-modal.component.css'],
  host: {
    class: 'ui big modal'
  }
})
export class ManagerSettingsModalComponent implements OnInit {
  @Output() action = new EventEmitter<any>();
  @ViewChild('tabElements', { static: true }) tabElements: ElementRef;

  public isLoading: boolean = false;
  public settings: any = {
    ftp: {},
    incoming: {}
  };

  constructor(private complianceService: ComplianceService) {}

  ngOnInit() {}

  ngAfterViewInit() {
    jQuery(this.tabElements.nativeElement)
      .find('.ui.tabular .item')
      .tab({
        onLoad: () => {
          ModalComponent.on('refresh');
        }
      });

    this.fetchSettings();
  }

  fetchSettings() {
    this.isLoading = true;
    this.complianceService.getSettings().then((settings: any) => {
      if (settings.ftp == undefined) {
        settings.ftp = {};
      }
      if (settings.incoming == undefined) {
        settings.incoming = {};
      }

      this.settings = settings;

      this.isLoading = false;
    });
  }

  onUpdate(event) {
    this.isLoading = true;
    this.complianceService.setSettings(this.settings).then((res: any) => {
      this.isLoading = false;
      ModalComponent.on('close');
    });

    event.stopPropagation();
    event.preventDefault();
  }
}
