import { KeyValue } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { EventStreamService } from '../../shared';

declare var $: any;

export interface AccountAdvanceModalInput {
  selectedSipGateWay: string;
  selectedCapacity: string;
  handleIsdnIncoming: boolean;
}

@Component({
  selector: 'app-account-advance-modal',
  templateUrl: './account-advance-modal.component.html',
  styleUrls: ['./account-advance-modal.component.scss']
})
export class AccountAdvanceModalComponent implements OnInit {
  readonly capacityOptions: KeyValue<string, string>[] = [
    { key: 'voice', value: 'Voice' },
    { key: 'fax', value: 'Fax' }
  ];
  readonly sipTypeOptions: KeyValue<string, string>[] = [
    { key: 'normal', value: 'Normal' },
    { key: 'bizphoneGateway', value: 'Bizphone Gateway' }
  ];

  @Output() closeModal = new EventEmitter();

  selectedSipGateWay: string;
  selectedCapacity: string;
  handleIsdnIncoming: boolean;

  constructor(private eventStreamService: EventStreamService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.eventStreamService.on('open-popup-advanced-configuration').subscribe(res => {
      this.show(res);
    });
  }

  show(data: AccountAdvanceModalInput) {
    this.selectedCapacity = data.selectedCapacity;
    this.selectedSipGateWay = data.selectedSipGateWay;
    this.handleIsdnIncoming = data.handleIsdnIncoming;
    $('#config-advanced-configuration').modal({ closable: false }).modal('show');
  }

  hide(isUpdate: boolean) {
    $('#config-advanced-configuration').modal('hide');
    this.closeModal.emit({
      isUpdate,
      selectedSipGateWay: this.selectedSipGateWay,
      selectedCapacity: this.selectedCapacity,
      handleIsdnIncoming: this.handleIsdnIncoming
    });
    const child = document.getElementById('config-advanced-configuration');
    const parent = child.parentElement;
    if (parent) {
      parent.removeChild(child);
    }
  }

  confirmUpdateConfig() {
    this.hide(true);
  }
}
