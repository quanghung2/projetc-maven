import { Pipe, PipeTransform } from '@angular/core';
import { Media, MediaService } from '@b3networks/api/workspace';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Pipe({
  name: 'thumbnails'
})
export class GetThumbnailsPipe implements PipeTransform {
  constructor(private mediaService: MediaService) {}

  transform(media: Media): Observable<string> {
    if (!media.uuid) {
      return of('');
    }
    return this.mediaService.getMediaImgThumbnail(media.uuid, media.convoUuid).pipe(map(res => res?.url));
  }
}
