import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CacheMedia, CacheMediaQuery, CacheMediaService, Pageable } from '@b3networks/api/common';
import { HashMap } from '@datorama/akita';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { RequestCreateMedia } from '../..';
import { FileDetail, Media } from './media.model';
import { MediaStore } from './media.store';

const MAX_AGE = 5 * 60 * 1000;

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  static URL_MEDIA_THUMBNAIL_PUBLIC = 'workspace/private/v1/media/public';
  loadingMap: HashMap<boolean> = {}; // messageId -> boolean

  constructor(
    private http: HttpClient,
    private store: MediaStore,
    private cacheMediaQuery: CacheMediaQuery,
    private cacheMediaService: CacheMediaService
  ) {}

  getThumbnails(convoId: string, page = 1, perPage = 10) {
    const params = new HttpParams()
      .append('convoUuids', convoId)
      .append('page', page.toString())
      .append('perPage', perPage.toString());

    return this.http.get<FileDetail[]>(`workspace/private/v1/media/thumbnails2`, { params }).pipe(
      map(data => data?.map(x => <FileDetail>{ ...x, convoId: convoId }) || []),
      tap(data => {
        this.store.upsertMany(data);
      })
    );
  }

  getMediaImgThumbnail(mediaUuid: string, convoGroupUuid: string): Observable<{ url: string }> {
    if (!mediaUuid || !convoGroupUuid) {
      return of(null);
    }

    const found = this.cacheMediaQuery.getMediaByKey(mediaUuid, false);
    if (found) {
      return of(found);
    } else {
      const url = `/workspace/private/v1/media/${mediaUuid}/thumbnails?convoUuid=${convoGroupUuid}`;
      return this.http.get<{ url: string }>(url).pipe(
        tap(res => {
          this.cacheMediaService.add(
            new CacheMedia({
              key: mediaUuid,
              url: res.url,
              time: Date.now()
            })
          );
        })
      );
    }
  }

  getMediaImgOriginal(mediaUuid: string, convoGroupUuid: string) {
    if (!mediaUuid || !convoGroupUuid) {
      return of(null);
    }

    const url = `/workspace/private/v1/media/${mediaUuid}?convoUuid=${convoGroupUuid}`;
    return this.http.get<{ url: string }>(url);
  }

  getMediaImgThumbnailPublic(mediaUuid: string, convoGroupUuid: string) {
    if (!mediaUuid || !convoGroupUuid) {
      return of(null);
    }

    const found = this.cacheMediaQuery.getMediaByKey(mediaUuid, false);
    if (found) {
      return of(found.url);
    } else {
      const url = `${MediaService.URL_MEDIA_THUMBNAIL_PUBLIC}/${mediaUuid}/thumbnails?convoUuid=${convoGroupUuid}`;
      return this.http.get<{ url: string }>(url).pipe(
        tap(res => {
          this.cacheMediaService.add(
            new CacheMedia({
              key: mediaUuid,
              url: res.url,
              time: Date.now()
            })
          );
        })
      );
    }
  }

  getMediaImgOriginalPublic(mediaUuid: string, convoGroupUuid: string) {
    const url = `${MediaService.URL_MEDIA_THUMBNAIL_PUBLIC}/${mediaUuid}/?convoUuid=${convoGroupUuid}`;
    return this.http.get<any>(url);
  }

  getThumbnailsByConvo(convoGroupUuid: string, pageable: Pageable) {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('convoUuids', convoGroupUuid);
    httpParams = httpParams.append('page', `${pageable.page}`);
    httpParams = httpParams.append('perPage', `${pageable.perPage}`);

    return this.http
      .get<Media[]>('workspace/private/v1/media/thumbnails', {
        params: httpParams
      })
      .pipe(map(medias => medias.map(media => new Media(media))));
  }

  createMediaFromStorage(req: RequestCreateMedia) {
    return this.http.post<{ mediaUuid: string; uri: string }>('workspace/private/v1/media/create', req);
  }

  deleteMediaFromStorage(fileKey: string, convoUuid: string) {
    const params = new HttpParams().append('convoUuid', convoUuid);
    return this.http.delete(`workspace2/private/v1/media/${fileKey}`, { params });
  }

  addMedias2Store(files: FileDetail[]) {
    this.store.upsertMany(files);
  }

  removeMedias2StoreByMsgId(msgId: string) {
    this.store.remove((enitty: FileDetail) => enitty.msgId === msgId);
  }
}
