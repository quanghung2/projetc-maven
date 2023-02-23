import { Directive, ElementRef, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Directive({
  selector: '[keyDownEvent]'
})
export class KeyDownHandlerDirective implements OnInit {
  @Input() currentSelect: number;
  @Input() totalRow: number;

  @Output() changeSelect = new EventEmitter<number>();
  @Output() enterSelect = new EventEmitter();

  constructor(private elRef: ElementRef) {}

  ngOnInit() {
    this.elRef.nativeElement.addEventListener('keydown', event => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.currentSelect -= 1;
        this.currentSelect = this.currentSelect < 0 ? this.totalRow - 1 : this.currentSelect;
        this.currentSelect %= this.totalRow;
        this.changeSelect.emit(this.currentSelect);
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.currentSelect += 1;
        this.currentSelect %= this.totalRow;
        this.changeSelect.emit(this.currentSelect);
      }

      if (event.key === 'Home' || event.key === 'End') {
        event.stopPropagation();
      }

      if (event.key === 'Enter') {
        this.enterSelect.emit(true);
      }
    });
  }
}
