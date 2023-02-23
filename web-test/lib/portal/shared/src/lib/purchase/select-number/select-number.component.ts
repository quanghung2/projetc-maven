import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { BundleItem } from '@b3networks/api/license';
import { B3Number, FindNumberReq, NumberQuery, NumberService } from '@b3networks/api/number';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { debounceTime, finalize, map, startWith, tap } from 'rxjs/operators';

export interface SelectNumberInput {
  numberSkus: BundleItem[];
  selectedNumbers: B3Number[];
}

export interface SkuInfo {
  sku: string;
  numberSku: string;
  name?: string;
  total: number;
  price?: number;
  max?: number;

  selectedNumbers: B3Number[];
}

@Component({
  selector: 'psh-select-number',
  templateUrl: './select-number.component.html',
  styleUrls: ['./select-number.component.scss']
})
export class SelectNumberComponent implements OnInit, OnChanges {
  private _numberChanged$ = new BehaviorSubject<Boolean>(true);

  numbers$: Observable<B3Number[]>;

  selectedSku: string;

  selectedNumberCount = 0;
  totalAvailableNumber1 = 0;

  searchNumberCtrl = new FormControl();

  loading: boolean;
  progressing: boolean;

  @Input() skuInfoMapping: HashMap<SkuInfo> = {};
  @Output() selectedConfirm = new EventEmitter<HashMap<SkuInfo>>();

  readonly KEYS = Object.keys;

  constructor(private numberQuery: NumberQuery, private numberService: NumberService, private toastr: ToastService) {}

  ngOnInit(): void {
    this.numbers$ = combineLatest([
      this.numberQuery.numbers$,
      this._numberChanged$,
      this.numberQuery.numbersChanged$
    ]).pipe(
      map(([numbers, _]) => {
        const selectedNumbers = (this.skuInfoMapping[this.selectedSku]?.selectedNumbers || []).map(n => n.number);
        return selectedNumbers ? numbers.filter(n => selectedNumbers.indexOf(n.number) === -1) : numbers;
      })
    );
    this.searchNumberCtrl.valueChanges.pipe(debounceTime(200), startWith('')).subscribe(_ => {
      this.loadNumbers();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.keys(this.skuInfoMapping)) {
      this.selectedSku = Object.keys(this.skuInfoMapping)[0];
      this.loadNumbers();
    }
  }

  skuChanged(event: MatTabChangeEvent) {
    this.loadNumbers(Object.keys(this.skuInfoMapping)[event.index]);
  }

  toggleNumber(number: B3Number) {
    const index = this.skuInfoMapping[this.selectedSku].selectedNumbers.findIndex(n => n.number === number.number);
    if (index > -1) {
      this.skuInfoMapping[this.selectedSku].selectedNumbers.splice(index, 1);
      this.selectedNumberCount -= 1;
    } else if (
      this.skuInfoMapping[this.selectedSku].selectedNumbers.length >= this.skuInfoMapping[this.selectedSku].total
    ) {
      this.toastr.warning(`Exceeded purchased numbers quota.`);
      return;
    } else {
      this.skuInfoMapping[this.selectedSku].selectedNumbers.push(number);
      this.selectedNumberCount += 1;
    }
    this._numberChanged$.next(true);
    this.selectedConfirm.emit(this.skuInfoMapping);
  }

  removeAll() {
    this.selectedNumberCount -= this.skuInfoMapping[this.selectedSku].selectedNumbers.length;
    this.skuInfoMapping[this.selectedSku].selectedNumbers = [];
    this.selectedConfirm.emit(this.skuInfoMapping);
  }

  private loadNumbers(sku?: string) {
    this.loading = true;
    this.selectedSku = sku || this.selectedSku;

    this.numberService
      .findNumbers(<FindNumberReq>{ sku: this.selectedSku, keyword: this.searchNumberCtrl.value }, {
        page: 1,
        perPage: 100
      })
      .pipe(
        tap(p => (this.totalAvailableNumber1 = p.totalCount)),
        map(p => p.content),
        finalize(() => (this.loading = false))
      )
      .subscribe();
  }
}
