import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventStreamService {
  subjects: any = {};
  observers: any = {};
  lastestDatas: any = {};

  constructor() {}

  on(id: string) {
    for (var key in this.subjects) {
      if (id === key) {
        return this.subjects[key];
      }
    }

    let subject = new Subject();
    let observer;
    let observable = Observable.create(ob => {
      observer = ob;
      return () => {};
    }).subscribe(subject);

    this.subjects[id] = subject;
    this.observers[id] = observer;

    return subject;
  }

  trigger(id: string, data?: any) {
    console.log('trigger: ' + id + ' V ');
    console.log(data);
    for (var key in this.observers) {
      if (id === key) {
        this.lastestDatas[key] = data;
        this.observers[key].next(data);
      }
    }
  }
}
