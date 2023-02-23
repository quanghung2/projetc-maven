import { AfterViewInit, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[b3nRecoverMatchHeight]'
})
export class RecoverMatchHeightDirective implements AfterViewInit {
  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    const content = this.el.nativeElement.offsetHeight;
    const footer = this.el.nativeElement.getElementsByClassName('recover-footer')[0];

    this.el.nativeElement.style.height = content - footer.offsetHeight + 'px';
  }
}
