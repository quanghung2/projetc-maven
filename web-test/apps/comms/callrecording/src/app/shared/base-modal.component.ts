import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import * as _ from 'lodash';

declare let $: any;
@Component({
  template: ''
})
export class BaseModalComponent implements OnDestroy {
  public subscriptions: Subscription[];

  constructor() {
    this.subscriptions = [];
  }

  ngOnDestroy() {
    _.forEach(this.subscriptions, (item: Subscription) => {
      item.unsubscribe();
    });

    this.subscriptions = [];
  }

  showModal(id: string) {
    setTimeout(() => {
      $(`${id}`)
        .modal({
          closable: false,
          observeChanges: true,
          autofocus: false
        })
        .modal('show')
        .focus();
    }, 100);
  }

  hideModal(id: string) {
    setTimeout(() => {
      $(`${id}`).modal('hide');
    }, 100);
  }
}
