import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface EventMessage {}

@Injectable({
  providedIn: 'root'
})
export class EventMessageService {
  private _subject: Subject<EventMessage> = new Subject<EventMessage>();

  constructor() {}

  get message$(): Observable<EventMessage> {
    return this._subject.asObservable();
  }

  sendMessage(message: EventMessage) {
    this._subject.next(message);
  }
}
