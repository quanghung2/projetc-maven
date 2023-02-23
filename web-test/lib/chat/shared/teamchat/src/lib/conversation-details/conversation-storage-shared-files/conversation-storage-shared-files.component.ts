import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {
  Channel,
  ChannelQuery,
  ChannelService,
  ChannelUI,
  FileDetail,
  MediaQuery,
  MediaService
} from '@b3networks/api/workspace';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

@Component({
  selector: 'b3n-conversation-storage-shared-files',
  templateUrl: './conversation-storage-shared-files.component.html',
  styleUrls: ['./conversation-storage-shared-files.component.scss']
})
export class ConversationStorageSharedFilesComponent implements OnChanges {
  @Input() convo: Channel;

  files$: Observable<FileDetail[]>;
  hasMore$: Observable<boolean>;
  loadingMore = false;

  private _id: string;

  constructor(
    private mediaService: MediaService,
    private mediaQuery: MediaQuery,
    private channelQuery: ChannelQuery,
    private channelService: ChannelService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['convo'] && this._id !== this.convo.id) {
      this._id = this.convo.id;

      this.files$ = this.mediaQuery.selectThumbnailsByConvo(this.convo.id);
      this.hasMore$ = this.channelQuery.selectUIState(this.convo.id, 'file').pipe(map(x => x?.hasMore));
    }
  }

  trackByFile(_: number, item: FileDetail) {
    return item.mediaId;
  }

  showMore() {
    const uiFile = this.channelQuery.getChannelUiState(this.convo.id)?.file;
    const nextPage = (uiFile?.page || 1) + 1;

    this.loadingMore = true;
    this.mediaService
      .getThumbnails(this.convo.id, nextPage, uiFile.perPage)
      .pipe(finalize(() => (this.loadingMore = false)))
      .subscribe(list => {
        this.channelService.updateChannelViewState(this.convo.id, <Partial<ChannelUI>>{
          file: {
            ...uiFile,
            page: nextPage,
            hasMore: list.length === uiFile.perPage
          }
        });
      });
  }
}
