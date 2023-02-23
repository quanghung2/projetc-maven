import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CHAT_PUBLIC_V2_PREFIX } from '@b3networks/shared/common';
import { forkJoin, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ChannelHyperspaceStore } from '../channel-hyperspace/channel-hyperspace.store';
import { ChannelHyperspace } from '../channel-hyperspace/model/channel-hyperspace.model';
import { ChannelStore } from '../channel/channel.store';
import { Channel } from '../channel/model/channel.model';

class StarInfo {
  convoId: string;
  hsId: string;
}

@Injectable({
  providedIn: 'root'
})
export class StarService {
  constructor(
    private http: HttpClient,
    private channelStore: ChannelStore,
    private channelHyperspaceStore: ChannelHyperspaceStore
  ) {}

  getStarChannels() {
    return this.http
      .get<StarInfo[]>('workspace2/private/v2/team/stars')
      .pipe(
        map(x => x || []),
        catchError(_ => of([]))
      )
      .pipe(
        tap(items => {
          const channel: StarInfo[] = items.filter(x => !x.hsId);
          if (channel.length > 0) {
            this.channelStore.update(
              channel.map(x => x.convoId),
              <Channel>{ isStarred: true }
            );
          }

          const channelHyper: StarInfo[] = items.filter(x => x.hsId);
          if (channelHyper.length > 0) {
            this.channelHyperspaceStore.update(
              channelHyper.map(x => x.convoId),
              <ChannelHyperspace>{ isStarred: true }
            );
          }
        })
      );
  }

  starChannelTeamChat(id: string) {
    return forkJoin([
      this.http.post(`workspace/private/v2/team-chat/${id}/star`, {}).pipe(catchError(_ => of(true))),
      this.http.post(`${CHAT_PUBLIC_V2_PREFIX}/public/_tc/channel/${id}/star`, {}).pipe(catchError(_ => of(true)))
    ]).pipe(
      tap(_ => {
        this.channelStore.update(id, <Channel>{
          isStarred: true
        });
      })
    );
  }

  unstarChannelTeamChat(id: string) {
    return forkJoin([
      this.http.delete(`workspace/private/v2/team-chat/${id}/star`).pipe(catchError(_ => of(true))),
      this.http.delete(`${CHAT_PUBLIC_V2_PREFIX}/public/_tc/channel/${id}/star`).pipe(catchError(_ => of(true)))
    ]).pipe(
      tap(_ => {
        this.channelStore.update(id, <Channel>{
          isStarred: false
        });
      })
    );
  }

  starChannelHyper(id: string, hsId: string) {
    return this.http.post(`workspace2/private/v2/team/${id}/hyperspace/${hsId}/star`, {}).pipe(
      tap(_ => {
        this.channelHyperspaceStore.update(id, <ChannelHyperspace>{
          isStarred: true
        });
      })
    );
  }

  unstarChannelHyper(id: string, hsId: string) {
    return this.http
      .delete<{ hyperchannels: { id: string; name: string }[] }>(
        `workspace2/private/v2/team/${id}/hyperspace/${hsId}/star`
      )
      .pipe(
        tap(_ => {
          this.channelHyperspaceStore.update(id, <ChannelHyperspace>{
            isStarred: false
          });
        })
      );
  }
}
