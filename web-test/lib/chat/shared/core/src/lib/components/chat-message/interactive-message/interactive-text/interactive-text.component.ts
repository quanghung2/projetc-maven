import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FileService } from '@b3networks/api/file';
import { IMessComponent, IMessLabelDisplay } from '@b3networks/api/workspace';
import { downloadData } from '@b3networks/shared/common';
import { OutputProcessMessage } from '../../../../core/model/output-message.model';
import { MarkdownService } from '../../../../core/service/markdown.service';
import { InfoShowMention } from '../../../../core/state/app-state.model';
import { InfoFileMarkdown } from '../../chat-message.component';

@Component({
  selector: 'csh-interactive-text',
  templateUrl: './interactive-text.component.html',
  styleUrls: ['./interactive-text.component.scss']
})
export class InteractiveTextComponent implements OnChanges {
  @Input() messageId: string;
  @Input() component: IMessComponent;

  @Output() showProfile: EventEmitter<InfoShowMention> = new EventEmitter<InfoShowMention>();

  errorText: string;
  builtTextMessage: OutputProcessMessage = <OutputProcessMessage>{
    text: '',
    isTriggerDirective: false
  };

  constructor(private markdownService: MarkdownService, private fileService: FileService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['component']) {
      this.errorText = !this.component?.text ? 'Unrenderable text!' : null;

      this.builtTextMessage =
        this.component?.display === IMessLabelDisplay.md
          ? this.markdownService.compile(this.component.text)
          : <OutputProcessMessage>{
              text: this.component.text,
              isTriggerDirective: false
            };
    }
  }

  onDownloadFileWithFileKey(data: InfoFileMarkdown) {
    this.fileService.downloadFileV3(data.fileKey).subscribe(resp => {
      const file = new Blob([resp.body], { type: `${resp.body.type}` });
      downloadData(file, data.fileName);
    });
  }
}
