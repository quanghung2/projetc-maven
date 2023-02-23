import { AfterViewInit, Directive, Input, OnDestroy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';

@Directive({
  selector: '[b3nFormatObjToJson]'
})
export class FormatObjToJsonDirective implements AfterViewInit, OnDestroy {
  @Input() id: string;
  @Input() control: UntypedFormControl;
  @Input() top: string;
  @Input() left: string;
  @Input() right: string;
  @Input() bottom: string;

  constructor() {}

  ngOnDestroy() {
    const curIcon = document.querySelector(`#child_${this.id}`);
    if (curIcon) {
      curIcon.parentNode.removeChild(curIcon);
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const element = document.getElementById(this.id);
      this.init(element);
    });
  }

  private init(element: HTMLElement) {
    element.parentElement.style.position = 'relative';
    element.insertAdjacentHTML(
      'afterend',
      `<img id="child_${this.id}" src="assets/flow-shared/icons/json_format.svg"/>`
    );

    var input = document.getElementById(`child_${this.id}`);
    input.style.position = 'absolute';

    if (this.top?.length && !this.bottom?.length) {
      input.style.top = `${this.top}px`;
    } else if (!this.top?.length && this.bottom?.length) {
      input.style.bottom = `${this.bottom}px`;
    } else {
      input.style.top = '0px';
    }

    if (this.left?.length && !this.right?.length) {
      input.style.left = `${this.left}px`;
    } else if (!this.left?.length && this.right?.length) {
      input.style.right = `${this.right}px`;
    } else {
      input.style.left = '0px';
    }

    input.style.width = '20px';
    input.style.height = '20px';
    input.style.border = '1px solid transparent';
    input.style.padding = '2px';
    input.style.borderRadius = '3px';
    input.style.cursor = 'pointer';

    const onMouseMove = () => {
      input.style.border = '1px solid hsla(0, 0%, 15%, 0.4)';
      input.style.backgroundColor = 'hsla(0, 1%, 40%, 0.2)';
    };

    const onMouseOut = () => {
      input.style.border = '1px solid transparent';
      input.style.backgroundColor = 'transparent';
    };

    input.addEventListener('mousemove', onMouseMove, true);
    input.addEventListener('mouseout', onMouseOut, true);
    input.addEventListener('click', () => {
      const value = this.control.value;
      if (value?.trim()?.length) {
        var obj = JSON.parse(value.replace(/{{/g, '"{{').replace(/}}/g, '}}"'));
        var pretty = JSON.stringify(obj, undefined, 4);
        this.control.setValue(pretty.replace(/"{{/g, '{{').replace(/}}"/g, '}}'));
      }
    });
  }
}
