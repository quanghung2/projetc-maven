import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  template: ''
})
export class DestroySubscriberComponent implements OnDestroy {
  protected destroySubscriber$ = new Subject();

  ngOnDestroy() {
    this.destroySubscriber$.next(true);
    this.destroySubscriber$.complete();

    this.destroy();
  }

  protected destroy() {
    // implements OnDestroy
  }
}
