import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { ContactService } from '../../shared';

declare var jQuery: any;

@Component({
  selector: 'app-subscribe-more-modal',
  templateUrl: './subscribe-more-modal.component.html',
  styleUrls: ['./subscribe-more-modal.component.css'],
  host: {
    class: 'ui modal'
  }
})
export class SubscribeMoreModalComponent implements OnInit {
  @ViewChild('dropdownSubscribeType', { static: true }) dropdownSubscribeType: ElementRef;
  @ViewChild('dropdownConcurrentCalls', { static: true }) dropdownConcurrentCalls: ElementRef;

  public subscribeType: string = 'ConcurrentCalls';
  public countConcurrentCalls: number = 2;
  public countBizPhoneExts: number = 1;
  public additionalInfo: string = '';

  constructor(private contactService: ContactService) {}

  ngOnInit() {}

  ngAfterViewInit() {
    jQuery(this.dropdownSubscribeType.nativeElement)
      .dropdown({
        onChange: value => {
          this.subscribeType = value;
        }
      })
      .dropdown('set selected', this.subscribeType);
    jQuery(this.dropdownConcurrentCalls.nativeElement)
      .dropdown({
        onChange: value => {
          this.countConcurrentCalls = +value;
        }
      })
      .dropdown('set selected', this.countConcurrentCalls);
  }

  changeCountBpExts(count: number) {
    this.countBizPhoneExts += +count;
    if (this.countBizPhoneExts <= 1) {
      this.countBizPhoneExts = 1;
    }
    return this.countBizPhoneExts;
  }

  sendContact() {
    let data = {
      type: this.subscribeType,
      count: this.subscribeType == 'ConcurrentCalls' ? this.countConcurrentCalls : this.countBizPhoneExts,
      info: this.additionalInfo
    };
    this.contactService.send(data);
  }
}
