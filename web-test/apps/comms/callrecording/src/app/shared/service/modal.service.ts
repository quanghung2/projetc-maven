import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export class ModalMessage {
  constructor(public component: any, public data: Object) {}
}

@Injectable()
export class ModalService {
  private modal: Subject<ModalMessage>;

  constructor() {
    this.modal = new Subject<ModalMessage>();
  }

  subscribe(func: any) {
    this.modal.subscribe(func);
  }

  load(message: ModalMessage) {
    this.modal.next(message);
  }
}
