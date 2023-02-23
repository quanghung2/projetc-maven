import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'shc-infinite-scroll',
  templateUrl: './infinite-scroll.component.html',
  styleUrls: ['./infinite-scroll.component.scss']
})
export class InfiniteScrollComponent implements AfterViewInit, OnDestroy {
  @Input() options = {};
  @Output() scrolled = new EventEmitter();
  @ViewChild('anchor') anchor?: ElementRef<HTMLElement>;

  private observer?: IntersectionObserver;

  constructor(private host: ElementRef) {
    console.log('constructor infinite scroll');
  }

  get element() {
    return this.host.nativeElement;
  }

  ngAfterViewInit() {
    const options = {
      root: this.isHostScrollable() ? this.host.nativeElement : null,
      ...this.options
    };

    this.observer = new IntersectionObserver(([entry]) => {
      entry.isIntersecting && this.scrolled.emit();
    }, options);
    if (this.anchor) {
      this.observer.observe(this.anchor.nativeElement);
    }
  }

  scrollToOffset(offset: number) {
    // console.log('scroll to ' + options);
    // options.top = this.element.scrollHeight - this.element.clientHeight;
    // this.element.scrollTo(options);
  }

  scrollToIndex(index: number) {
    // todo nothing
  }

  scrollToBottom() {
    const options = <ScrollToOptions>{ top: 0, behavior: 'smooth' };
    options.top = this.element.scrollHeight - this.element.clientHeight;
    this.element.scrollTo(options);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  private isHostScrollable() {
    const style = window.getComputedStyle(this.element);
    return style.getPropertyValue('overflow') === 'auto' || style.getPropertyValue('overflow-y') === 'scroll';
  }
}
