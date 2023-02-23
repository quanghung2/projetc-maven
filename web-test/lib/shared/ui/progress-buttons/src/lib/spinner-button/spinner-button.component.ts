import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatProgressButtonOptions } from '../progress-button-options.model';

export const DEFAULT_SPINNER_BUTTON_OPTIONS = <MatProgressButtonOptions>{
  spinnerSize: 16,
  raised: true,
  mode: 'indeterminate'
};

@Component({
  selector: 'mat-spinner-button',
  templateUrl: './spinner-button.component.html',
  styleUrls: ['./spinner-button.component.scss']
})
export class SpinnerButtonComponent {
  private _options: MatProgressButtonOptions;

  @Input() set options(options: MatProgressButtonOptions) {
    options = options || <MatProgressButtonOptions>{};
    this._options = <MatProgressButtonOptions>{ ...DEFAULT_SPINNER_BUTTON_OPTIONS, ...options };
  }

  get options(): MatProgressButtonOptions {
    return this._options;
  }

  @Output() btnClick: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();

  clicked(event: MouseEvent) {
    if (!this.options.disabled && !this.options.active) {
      this.btnClick.emit(event);
    }
  }
}
