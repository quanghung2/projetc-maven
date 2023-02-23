import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { IMessComponent, IMessElementType, IMessLabelDisplay } from '@b3networks/api/workspace';
import { HashMap } from '@datorama/akita';
import { OutputProcessMessage } from '../../../../core/model/output-message.model';
import { MarkdownService } from '../../../../core/service/markdown.service';

@Component({
  selector: 'csh-interactive-input',
  templateUrl: './interactive-input.component.html',
  styleUrls: ['./interactive-input.component.scss']
})
export class InteractiveInputComponent implements OnChanges {
  @Input() messageId: string;
  @Input() component: IMessComponent;
  @Input() control: FormControl;
  @Input() uploadPercentage: number;
  @Input() uploadStatusMap: HashMap<boolean>;
  @Input() isSubmiting: boolean;

  errorText: string;
  builtTextMessage: OutputProcessMessage = <OutputProcessMessage>{
    text: '',
    isTriggerDirective: false
  };
  backgroundUploading: boolean;

  readonly IMessElementType = IMessElementType;

  constructor(private markdownService: MarkdownService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['component']) {
      this.errorText = !this.component?.element || !this.component?.element?.type ? 'Unrenderable input!' : null;

      if (this.component.element.default_value) {
        this.control.setValue(this.component.element.default_value);
      }

      if (this.component.element.default_option_value) {
        this.control.setValue(this.component.element.default_option_value);
      }

      if (this.component?.label) {
        this.builtTextMessage =
          this.component.label?.display === IMessLabelDisplay.md
            ? this.markdownService.compile(this.component.label.text)
            : <OutputProcessMessage>{
                text: this.component.label.text,
                isTriggerDirective: false
              };
      }
    }
  }
}
