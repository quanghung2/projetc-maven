import { Component, OnInit } from '@angular/core';
import { Extension, SpeechEntry, Text2SpeechEntry } from '@b3networks/api/bizphone';
import { ExtensionQuery, ExtensionService } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { filter, map, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-custom-moh',
  templateUrl: './custom-moh.component.html',
  styleUrls: ['./custom-moh.component.scss']
})
export class CustomMohComponent extends DestroySubscriberComponent implements OnInit {
  text2speech: Text2SpeechEntry;
  text2speechUpload: Text2SpeechEntry;
  extension: Extension;
  loading = true;

  constructor(
    private extensionQuery: ExtensionQuery,
    private extensionService: ExtensionService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.extensionQuery
      .selectActive()
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(ext => !!ext && ext instanceof Extension),
        map(ext => ext as Extension),
        tap((ext: Extension) => {
          this.extension = ext;
          this.text2speech = ext.ringConfig.mohConfigs?.entries?.length
            ? ext.ringConfig.mohConfigs.entries[0]
            : new SpeechEntry();
          this.loading = false;
        })
      )
      .subscribe();
  }

  ttsChange(text2speech: Text2SpeechEntry) {
    this.text2speechUpload = text2speech;
  }

  save() {
    const body = {
      mohConfigs: {
        ...this.extension.ringConfig.mohConfigs,
        entries: [this.text2speechUpload]
      }
    };

    this.extensionService.updateMoh(this.extension.extKey, body).subscribe(
      () => {
        this.loading = true;
        this.toastService.success('Update MOH successfully');
        this.extensionService.getDetails(this.extension.extKey).subscribe(() => (this.loading = false));
      },
      err => this.toastService.warning(err.message)
    );
  }
}
