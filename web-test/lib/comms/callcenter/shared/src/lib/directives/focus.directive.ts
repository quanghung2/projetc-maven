import { Directive, ElementRef, EventEmitter, Inject, Input, Renderer } from '@angular/core';

@Directive({
  selector: '[focus]'
})
export class FocusDirective {
  @Input('focus') focusEvent: EventEmitter<boolean>;

  constructor(@Inject(ElementRef) private element: ElementRef, private renderer: Renderer) {}

  ngOnInit() {
    if (this.focusEvent) {
      this.focusEvent.subscribe((event: any) => {
        this.element.nativeElement.focus();
      });
    }
  }
}
