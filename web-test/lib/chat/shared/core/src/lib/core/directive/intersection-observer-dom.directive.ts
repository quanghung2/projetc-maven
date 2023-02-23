import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

@Directive({
  selector: '[intersectionObserverDom]'
})
export class IntersectionObserverDomDirective implements AfterViewInit, OnInit, OnDestroy {
  private observer: IntersectionObserver | null;

  @Input() intersectionObserverDom: HTMLElement;

  @Output() render = new EventEmitter<boolean>();

  constructor(private elementRef: ElementRef) {
    this.observer = null;
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      entries => {
        // 1:1 Observer to Target
        if (entries?.some(e => e?.isIntersecting)) {
          this.render.emit(true);
          this.observer?.disconnect();
          this.observer = null;
        }
      },
      {
        root: this.intersectionObserverDom ? this.intersectionObserverDom : null
      }
    );
    this.observer.observe(this.elementRef.nativeElement);
  }
}
