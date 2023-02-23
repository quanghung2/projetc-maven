import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class StreamService {
  public stream: Subject<Stream>;

  constructor() {
    this.stream = new Subject<Stream>();
  }

  next(stream: Stream) {
    this.stream.next(stream);
  }

  getStream() {
    return this.stream;
  }
}

export class Stream {
  constructor(public id?: StreamId, public data?: any) {}
}

export enum StreamId {
  SHOW_ACL_ACTION_MODAL,
  UPDATE_ACL_CONFIG,
  SHOW_CALLERIDS_VIEW_MODAL,
  SHOW_ASSIGN_MODAL,
  REFRESH_SUBSCRIPTIONS
}
