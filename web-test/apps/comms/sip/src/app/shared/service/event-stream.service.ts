import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class EventStreamService {
  subjects: any = {};
  observers: any = {};

  constructor() {}

  on(id: string) {
    for (const key in this.subjects) {
      if (id === key) {
        return this.subjects[key];
      }
    }

    const subject = new Subject();
    const observer = new Observable().subscribe(subject);
    this.subjects[id] = subject;
    this.observers[id] = observer;

    return subject;
  }

  trigger(id: string, data: any) {
    for (const key in this.observers) {
      if (id === key) {
        this.observers[key].next(data);
      }
    }
  }
}
