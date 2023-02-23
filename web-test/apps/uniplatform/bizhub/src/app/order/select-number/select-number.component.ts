import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { BundleItem } from '@b3networks/api/license';
import { B3Number, FindNumberReq, NumberQuery, NumberService } from '@b3networks/api/number';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { debounceTime, finalize, map, startWith, tap } from 'rxjs/operators';
import { LoadNumberComponent, LoadNumberInput } from '../load-number/load-number.component';

export interface SelectNumberInput {
  numberSkus: BundleItem[];
  selectedNumbers: B3Number[];
  orgUuid: string;
}

export interface SkuInfo {
  sku: string;
  numberSku: string;
  name?: string;
  total: number;

  selectedNumbers: B3Number[];
}

@Component({
  selector: 'b3n-select-number',
  templateUrl: './select-number.component.html',
  styleUrls: ['./select-number.component.scss']
})
export class SelectNumberComponent implements OnInit {
  private _numberChanged$ = new BehaviorSubject<Boolean>(true);

  numbers$: Observable<B3Number[]>;
  skuInfoMapping: HashMap<SkuInfo> = {};
  selectedSku: string;

  selectedNumberCount = 0;
  totalAvailabelNumber = 0;

  searchNumberCtrl = new UntypedFormControl();

  loading: boolean;
  progressing: boolean;

  readonly KEYS = Object.keys;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: SelectNumberInput,
    private dialogRef: MatDialogRef<SelectNumberComponent>,
    private numberQuery: NumberQuery,
    private numberService: NumberService,
    private toastr: ToastService,
    private dialog: MatDialog
  ) {
    data.numberSkus.forEach(l => {
      let sku = this.skuInfoMapping[l.numberSku];
      if (sku) {
        sku.total += l.quantity;
      } else {
        const selectedNumbers = data.selectedNumbers?.filter(n => n.country === l.numberSku) || [];
        sku = <SkuInfo>{ sku: l.sku, numberSku: l.numberSku, total: l.quantity, selectedNumbers: selectedNumbers };
        this.selectedNumberCount += selectedNumbers.length;
      }
      this.skuInfoMapping[l.numberSku] = sku;
    });
    this.selectedSku = Object.keys(this.skuInfoMapping)[0];
  }

  ngOnInit(): void {
    this.numbers$ = combineLatest([this.numberQuery.numbers$, this._numberChanged$]).pipe(
      map(([numbers, _]) => {
        const selectedNumbers = (this.skuInfoMapping[this.selectedSku].selectedNumbers || []).map(n => n.number);
        return selectedNumbers.length ? numbers.filter(n => !selectedNumbers.includes(n.number)) : numbers;
      })
    );
    this.searchNumberCtrl.valueChanges.pipe(debounceTime(200), startWith('')).subscribe(_ => {
      this.loadNumbers();
    });
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
  }

  removeAll() {
    this.selectedNumberCount -= this.skuInfoMapping[this.selectedSku].selectedNumbers.length;
    this.skuInfoMapping[this.selectedSku].selectedNumbers = [];
  }

  save() {
    this.dialogRef.close(this.skuInfoMapping);
  }

  loadNumberFromFile() {
    console.log(this.selectedSku);
    console.log(this.skuInfoMapping[this.selectedSku]);

    this.dialog
      .open(LoadNumberComponent, {
        width: '400px',
        disableClose: true,
        data: <LoadNumberInput>{
          skuInfo: this.skuInfoMapping[this.selectedSku]
        }
      })
      .afterClosed()
      .subscribe((numbers: B3Number[]) => {
        let total =
          this.skuInfoMapping[this.selectedSku].total - this.skuInfoMapping[this.selectedSku].selectedNumbers.length;
        total = total > numbers.length ? numbers.length : total;
        this.skuInfoMapping[this.selectedSku].selectedNumbers.push(...numbers.slice(0, total));
        this._numberChanged$.next(true);
      });
  }

  private loadNumbers(sku?: string) {
    this.loading = true;
    this.selectedSku = sku || this.selectedSku;

    this.numberService
      .findNumbers(
        <FindNumberReq>{ sku: this.selectedSku, keyword: this.searchNumberCtrl.value },
        {
          page: 1,
          perPage: 100
        },
        this.data.orgUuid
      )
      .pipe(
        tap(p => (this.totalAvailabelNumber = p.totalCount)),
        map(p => p.content),
        finalize(() => (this.loading = false))
      )
      .subscribe();
  }
}
