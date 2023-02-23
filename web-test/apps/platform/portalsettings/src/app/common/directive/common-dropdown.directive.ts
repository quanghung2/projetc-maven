import { AfterViewInit, Directive, ElementRef, Input, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

declare let $: any;

@Directive({
  selector: '[commonDropdown]'
})
export class CommonDropdownDirective implements AfterViewInit, OnDestroy {
  _ngModel: any;
  ngModelSubject: Subject<any> = new BehaviorSubject(null);
  @Input()
  get ngModel(): any {
    return this._ngModel;
  }
  set ngModel(value: any) {
    this._ngModel = value;
    this.ngModelSubject.next(value);
  }

  _fullTextSearch: string;
  fullTextSearchSubject: Subject<string> = new BehaviorSubject(null);
  @Input()
  get fullTextSearch(): string {
    return this._fullTextSearch;
  }
  set fullTextSearch(value: string) {
    this._fullTextSearch = value;
    this.fullTextSearchSubject.next(value);
  }

  _forceSelection: boolean;
  forceSelectionSubject: Subject<boolean> = new BehaviorSubject(null);
  @Input()
  get forceSelection(): boolean {
    return this._forceSelection;
  }
  set forceSelection(value: boolean) {
    this._forceSelection = value;
    this.forceSelectionSubject.next(value);
  }

  private element;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.element = $(this.el.nativeElement);
    this.element.dropdown({});
    //TODO fix this later
    // combineLatest(this.fullTextSearchSubject, this.forceSelectionSubject, (fullTextSearch, forceSelection) => this.element.dropdown({
    //   fullTextSearch: fullTextSearch,
    //   forceSelection: forceSelection
    // }));
    this.ngModelSubject.subscribe(value => this.element.dropdown('set selected', value));
  }

  ngOnDestroy() {
    if (this.element != null) {
      this.element.dropdown('unbind intent');
    }
  }
}
