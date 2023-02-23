import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { cacheable } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Channel } from './channel.model';
import { ChannelStore } from './channel.store';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  constructor(private http: HttpClient, private channelStore: ChannelStore) {}

  getChannels(): Observable<Channel[]> {
    const request$ = this.http.get<Channel[]>('/store/private/v2/app/channels').pipe(
      map(res => res.map(channel => new Channel(channel))),
      tap((channels: Channel[]) => {
        this.channelStore.set(channels);
      })
    );

    return cacheable(this.channelStore, request$);
  }
}
