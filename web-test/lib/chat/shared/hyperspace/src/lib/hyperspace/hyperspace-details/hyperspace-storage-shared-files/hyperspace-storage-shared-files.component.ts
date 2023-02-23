import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {
  ChannelHyperspace,
  ChannelHyperspaceQuery,
  ChannelHyperspaceService,
  ChannelHyperspaceUI,
  FileDetail,
  MediaQuery,
  MediaService
} from '@b3networks/api/workspace';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

@Component({
  selector: 'b3n-hyperspace-storage-shared-files',
  templateUrl: './hyperspace-storage-shared-files.component.html',
  styleUrls: ['./hyperspace-storage-shared-files.component.scss']
})
export class HyperspaceStorageSharedFilesComponent implements OnChanges {
  @Input() convo: ChannelHyperspace;

  files$: Observable<FileDetail[]>;
  hasMore$: Observable<boolean>;
  loadingMore = false;

  private _id: string;

  constructor(
    private mediaService: MediaService,
    private mediaQuery: MediaQuery,
    private channelHyperspaceQuery: ChannelHyperspaceQuery,
    private channelHyperspaceService: ChannelHyperspaceService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['convo'] && this._id !== this.convo.id) {
      this._id = this.convo.id;

      this.files$ = this.mediaQuery.selectThumbnailsByConvo(this.convo.id);
      this.hasMore$ = this.channelHyperspaceQuery.selectUIState(this.convo.id, 'file').pipe(map(x => x?.hasMore));
    }
  }

  trackByFile(_: number, item: FileDetail) {
    return item.mediaId;
  }

  showMore() {
    const uiFile = this.channelHyperspaceQuery.getChannelUiState(this.convo.id)?.file;
    const nextPage = (uiFile?.page || 1) + 1;

    this.loadingMore = true;
    this.mediaService
      .getThumbnails(this.convo.id, nextPage, uiFile.perPage)
      .pipe(finalize(() => (this.loadingMore = false)))
      .subscribe(list => {
        this.channelHyperspaceService.updateChannelViewState(this.convo.id, <Partial<ChannelHyperspaceUI>>{
          file: {
            ...uiFile,
            page: nextPage,
            hasMore: list.length === uiFile.perPage
          }
        });
      });
  }
}
