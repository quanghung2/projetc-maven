import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { MetaData, SCMetaDataQuery } from '@b3networks/api/workspace';
import { RequestUpdateTxns, Txn, TxnQuery, TxnService } from '@b3networks/chat/shared/core';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest, debounceTime, filter, map, mergeMap, Observable, startWith } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-txn-information',
  templateUrl: './txn-information.component.html',
  styleUrls: ['./txn-information.component.scss']
})
export class TxnInformationComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  @Input() txn: Txn;

  productsDisplay$: Observable<string>;
  typeDisplay$: Observable<MetaData>;
  severityDisplay$: Observable<MetaData>;

  type$: Observable<MetaData[]> = this.caseMetadataQuery.typeList$;
  severity$: Observable<MetaData[]> = this.caseMetadataQuery.severityList$;

  productFC = new FormControl();
  products$: Observable<MetaData[]>;

  typeId = this.fb.control(null);
  productIds = this.fb.control([]);
  severityId = this.fb.control(null);

  private _txnUuid: string;

  constructor(
    private caseMetadataQuery: SCMetaDataQuery,
    private txnService: TxnService,
    private txnQuery: TxnQuery,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    super();
  }

  ngOnInit() {
    this.products$ = this.productFC.valueChanges.pipe(
      startWith(''),
      debounceTime(200),
      mergeMap((searchSTring: string) => {
        return this.caseMetadataQuery.productList$.pipe(
          filter(list => list != null),
          map(products => products.filter(p => p.name.toLocaleLowerCase().includes(searchSTring?.toLocaleLowerCase())))
        );
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['txn'] && this.txn && this._txnUuid !== this.txn.txnUuid) {
      this._txnUuid = this.txn.txnUuid;

      this.productsDisplay$ = combineLatest([
        this.caseMetadataQuery.productList$,
        this.txnQuery.selectEntity(this._txnUuid, entity => entity?.productIds || [])
      ]).pipe(
        filter(([products, entity]) => products?.length > 0 && entity?.length > 0),
        map(([products, entity]) => {
          return products?.filter(p => entity?.includes(p.id)).map(p => p.name);
        }),
        map(products => products?.join(', ') || 'None')
      );

      this.typeDisplay$ = combineLatest([
        this.caseMetadataQuery.typeList$,
        this.txnQuery.selectEntity(this._txnUuid, entity => entity?.typeId)
      ]).pipe(
        map(([types, entity]) => {
          return types?.find(i => i.id === entity);
        })
      );

      this.severityDisplay$ = combineLatest([
        this.caseMetadataQuery.severityList$,
        this.txnQuery.selectEntity(this._txnUuid, entity => entity?.severityId)
      ]).pipe(
        map(([list, entity]) => {
          return list?.find(i => i.id === entity);
        })
      );

      this.txnQuery
        .selectUIState(this._txnUuid, 'loadedDetail')
        .pipe(
          filter(loaded => loaded),
          takeUntil(this.destroySubscriber$),
          take(1)
        )
        .subscribe(() => {
          this.txn = this.txnQuery.getEntity(this.txn.txnUuid);
          this.typeId.setValue(this.txn?.typeId);
          this.productIds.setValue(this.txn?.productIds);
          this.severityId.setValue(this.txn?.severityId);
        });
    }
  }

  onTypeChange(event: number) {
    const req = <RequestUpdateTxns>{
      typeId: event
    };
    this.txnService.updateTxnV2(this.txn.txnUuid, req).subscribe(
      () => {},
      err => {
        this.toastService.error(err.message);
      }
    );
  }

  onSeverityChange(event: number) {
    const req = <RequestUpdateTxns>{
      severityId: event
    };
    this.txnService.updateTxnV2(this.txn.txnUuid, req).subscribe(
      () => {},
      err => {
        this.toastService.error(err.message);
      }
    );
  }

  onProductChange(newProductIds: number[]) {
    const removingProductIds = this.txn.productIds.filter(p => !newProductIds.includes(p));
    const addingProductIds = newProductIds.filter(p => !this.txn.productIds.includes(p));
    if (!removingProductIds.length && !addingProductIds.length) {
      // nohting todo
      return;
    }

    const req = <RequestUpdateTxns>{
      addProductIds: addingProductIds,
      removeProductIds: removingProductIds
    };
    this.txnService.updateTxnV2(this.txn.txnUuid, req).subscribe(
      () => {},
      err => {
        this.toastService.error(err.message);
      }
    );
  }
}
