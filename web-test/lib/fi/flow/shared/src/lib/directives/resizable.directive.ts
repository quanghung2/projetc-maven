import { Directive, ElementRef, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

export enum ResizableDirection {
  left = 'left',
  right = 'right'
}

@Directive({
  selector: '[appResizable]' // Attribute selector
})
export class ResizableDirective implements OnInit, OnChanges {
  @Input() resizableGrabWidth = 4;
  @Input() resizableMinWidth = 400;
  @Input() direction: ResizableDirection = ResizableDirection.left;

  dragging = false;
  border: string;

  constructor(private el: ElementRef) {
    function preventGlobalMouseEvents() {
      document.body.style['pointer-events'] = 'none';
    }

    function restoreGlobalMouseEvents() {
      document.body.style['pointer-events'] = 'auto';
    }

    const newWidth = wid => {
      const newWidth = Math.max(this.resizableMinWidth, wid);
      el.nativeElement.style.width = newWidth + 'px';
    };

    const mouseMoveG = evt => {
      if (evt.clientX < this.el.nativeElement.offsetLeft) {
        this.el.nativeElement.style[this.border] = this.resizableGrabWidth + 'px solid transparent';
      }
      if (!this.dragging) {
        return;
      }
      if (this.direction === ResizableDirection.left) {
        newWidth(el.nativeElement.offsetLeft - evt.clientX + this.el.nativeElement.clientWidth);
      } else {
        newWidth(evt.clientX - el.nativeElement.offsetLeft);
      }
      evt.stopPropagation();
    };

    const mouseUpG = evt => {
      if (!this.dragging) {
        return;
      }
      restoreGlobalMouseEvents();
      this.dragging = false;
      evt.stopPropagation();
    };

    const mouseDown = evt => {
      if (this.inDragRegion(evt)) {
        this.dragging = true;
        preventGlobalMouseEvents();
        evt.stopPropagation();
      }
    };

    const mouseMove = evt => {
      if (this.inDragRegion(evt) || this.dragging) {
        el.nativeElement.style.cursor = 'col-resize';
        this.el.nativeElement.style[this.border] = this.resizableGrabWidth + 'px solid #e3e3e9';
      } else {
        el.nativeElement.style.cursor = 'default';
        this.el.nativeElement.style[this.border] = this.resizableGrabWidth + 'px solid transparent';
      }
    };

    document.addEventListener('mousemove', mouseMoveG, true);
    document.addEventListener('mouseup', mouseUpG, true);
    el.nativeElement.addEventListener('mousedown', mouseDown, true);
    el.nativeElement.addEventListener('mousemove', mouseMove, true);
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.el.nativeElement.style.width = this.resizableMinWidth + 'px';
  }

  ngOnInit(): void {
    this.border = this.direction === ResizableDirection.left ? 'border-left' : 'border-right';
    this.el.nativeElement.style[this.border] = this.resizableGrabWidth + 'px solid transparent';
  }

  inDragRegion(evt) {
    if (this.direction === ResizableDirection.left) {
      return evt.clientX - this.el.nativeElement.offsetLeft < this.resizableGrabWidth + 4;
    } else {
      return (
        this.el.nativeElement.clientWidth - evt.clientX + this.el.nativeElement.offsetLeft < this.resizableGrabWidth
      );
    }
  }
}
