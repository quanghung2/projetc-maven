import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { EventStreamService } from '../../shared';

declare var $: any;

@Component({
  selector: 'app-confirm-update-account-config',
  templateUrl: './confirm-update-account-config.component.html',
  styleUrls: ['./confirm-update-account-config.component.scss']
})
export class ConfirmUpdateAccountConfigComponent implements OnInit {
  @Output() closeModal = new EventEmitter();

  constructor(private eventStreamService: EventStreamService) {}

  ngOnInit() {
    this.eventStreamService.on('confirm-update-advanced-configuration').subscribe(res => {
      this.show();
    });
  }

  show() {
    $('#confirm-update-advanced-configuration').modal({ closable: false }).modal('show');
  }

  hide(isUpdate: boolean) {
    $('#confirm-update-advanced-configuration').modal('hide');
    this.closeModal.emit({ isUpdate });
    const child = document.getElementById('confirm-update-advanced-configuration');
    const parent = child.parentElement;
    if (parent) {
      parent.removeChild(child);
    }
  }
}
