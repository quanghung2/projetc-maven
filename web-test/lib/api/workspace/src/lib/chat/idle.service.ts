import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CHAT_PUBLIC_PREFIX } from '@b3networks/shared/common';
import { Idle, NotIdle } from 'idlejs/dist';

export enum WsState {
  active = 'active',
  inactive = 'inactive'
}

@Injectable({ providedIn: 'root' })
export class IdleService {
  private idle: Idle;
  private notIdle: NotIdle;

  idleStatus: WsState = WsState.active;

  constructor(private http: HttpClient) {}

  start() {
    this.stop();

    console.log('started idle...');
    this.idle = new Idle();
    this.notIdle = new NotIdle();
    this.idleStatus = WsState.active;

    // if user idle in document 2 minutes ==> send idle status into ms-chat
    this.idle
      .whenNotInteractive()
      .within(2)
      .do(() => this.updateWebsocketStatus(WsState.inactive))
      .start();

    // when user interactive --> set active every 5 seconds
    this.notIdle
      .whenInteractive()
      .within(5, 1000)
      .do(() => this.updateWebsocketStatus(WsState.active))
      .start();
  }

  stop() {
    console.log('stopped idle...');
    this.idle?.stop();
    this.notIdle?.stop();
  }

  private updateWebsocketStatus(state: WsState) {
    if (state === this.idleStatus) {
      return;
    }

    this.http
      .post<{ state: WsState }>(`${CHAT_PUBLIC_PREFIX}/wss/status`, { state: state })
      .subscribe((x: { state: WsState }) => {
        this.idleStatus = x.state;
      });
  }
}
