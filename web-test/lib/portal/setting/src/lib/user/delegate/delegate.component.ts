import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { KeyValue } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ExtDevice, Extension, ExtensionBase, RingMode } from '@b3networks/api/bizphone';
import {
  AgentService,
  AgentStatus,
  ExtensionGroupService,
  ExtensionQuery,
  ExtensionService,
  Me
} from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { debounceTime, filter, finalize, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { DEFAULT_WARNING_MESSAGE } from '../../shared/contants';

@Component({
  selector: 'b3n-delegate',
  templateUrl: './delegate.component.html',
  styleUrls: ['./delegate.component.scss']
})
export class DelegateComponent implements OnInit, OnDestroy {
  extension: Extension;

  extensionSelected: string[] = [];
  baseExtensionSelected: string[] = [];
  removeExtensionSelected: string[] = [];

  extensionCtrl = new UntypedFormControl();
  extensions$: Observable<ExtensionBase[]>;
  progressing: boolean;
  MAX_NUMBER_ADDED = 5;
  delegatedDevices: ExtDevice[] = [];
  extensionsInGroups: string[] = [];
  isActiveExtensionInGroups: boolean;
  agents: HashMap<Me> = {};
  loading: boolean;

  readonly AgentStatus = AgentStatus;
  readonly RingMode = RingMode;
  readonly optRingTime: KeyValue<number, string>[] = [
    { key: 15, value: '15' },
    { key: 20, value: '20' },
    { key: 30, value: '30' },
    { key: 45, value: '45' },
    { key: 60, value: '60' },
    { key: 90, value: '90' }
  ];
  private _change$ = new BehaviorSubject<boolean>(true);
  private _destroy$ = new Subject<boolean>();

  @ViewChild('extensionInput') extensionInput: ElementRef;

  constructor(
    private extensionQuery: ExtensionQuery,
    private extensionService: ExtensionService,
    private toastService: ToastService,
    private extensionGroupService: ExtensionGroupService,
    private agentService: AgentService
  ) {}

  ngOnInit() {
    this.extensionQuery
      .selectActive()
      .pipe(
        filter(ext => ext != null && ext instanceof Extension),
        switchMap(extension => {
          return combineLatest([
            of(extension),
            this.extensionGroupService.checkExtensionsExistInAnyGroup([extension.extKey])
          ]);
        }),
        takeUntil(this._destroy$),
        tap(async ([ext, resp]) => {
          this.extension = new Extension(cloneDeep(ext));
          this.extensionSelected = this.extension.cdConfig.extList;
          this.baseExtensionSelected = [...this.extensionSelected];
          this.removeExtensionSelected = [];

          this.isActiveExtensionInGroups = resp[ext.extKey];
          if (this.extensionSelected.length < this.MAX_NUMBER_ADDED && !this.isActiveExtensionInGroups) {
            this.extensionCtrl.enable();
          } else {
            this.extensionCtrl.disable();
          }
          this.delegatedDevices = this.extension.devices.filter(d => d.isDelegated);
          this.initDelegatedData();
        })
      )
      .subscribe();

    this.extensions$ = combineLatest([
      this.extensionCtrl.valueChanges.pipe(startWith('')),
      this._change$,
      this.extensionService.getAllExtenison(false, { filterDelegable: 'true' })
    ])
      .pipe(debounceTime(100), takeUntil(this._destroy$))
      .pipe(
        switchMap(([value, _, extensions]) => {
          value = value?.toLocaleLowerCase();

          return of(
            extensions.filter(
              e =>
                (e.extKey?.toLocaleLowerCase().includes(value) || e.extLabel?.toLocaleLowerCase().includes(value)) &&
                !this.extensionSelected.includes(e.extKey)
            )
          );
        })
      );
  }

  ngOnDestroy() {
    this._change$.next(true);
    this._change$.complete();
    this._destroy$.next(true);
    this._destroy$.complete();
  }

  displayFn(ext: Extension): string {
    return ext ? ext.displayText : '';
  }

  selected(event: MatAutocompleteSelectedEvent | string): void {
    const text = typeof event === 'string' ? event : event.option.value?.trim();
    if (!text) {
      return;
    }
    if (text === this.extension.extKey) {
      this.toastService.warning('Extension cannot delegate itself');
      this.extensionCtrl.setValue('');
      this.extensionInput.nativeElement?.blur();
      return;
    }
    this.extensionSelected.push(text);
    if (this.extensionSelected.length >= this.MAX_NUMBER_ADDED) {
      this.extensionCtrl.disable();
    }
    this._change$.next(true);
    this.extensionCtrl.setValue('');
    this.extensionInput.nativeElement?.blur();
  }

  dropDispositionCodes(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.extensionSelected, event.previousIndex, event.currentIndex);
  }

  removeExtensionFromList(extkey: string) {
    if (!this.extensionSelected) {
      return;
    }

    this.extensionSelected.splice(this.extensionSelected.indexOf(extkey), 1);

    if (this.baseExtensionSelected.includes(extkey) && !this.removeExtensionSelected.includes(extkey)) {
      this.removeExtensionSelected.push(extkey);
    }

    if (this.extensionSelected.length < this.MAX_NUMBER_ADDED) {
      this.extensionCtrl.enable();
    }

    this._change$.next(true);
  }

  onSave() {
    this.progressing = true;
    const cdConfig = this.extension.cdConfig;
    cdConfig.extList = this.extensionSelected;

    this.extensionService
      .update(this.extension.extKey, { cdConfig: cdConfig, mailBox: this.extension.mailBox })
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.toastService.success('Apply successfully!');
        },
        error => {
          this.toastService.warning(error.message || DEFAULT_WARNING_MESSAGE);
        }
      );
  }

  async initDelegatedData() {
    this.agents = {};
    this.loading = true;

    for (let i = 0; i < this.delegatedDevices.length; i++) {
      const dExt = this.extensionQuery.getExtensionByKey(this.delegatedDevices[i].delegatedFrom);

      if (!dExt) {
        return;
      }

      if (dExt.identityUuid) {
        const agent = await this.agentService.getAgentByIdentityUuid(dExt.identityUuid).toPromise();
        this.agents[dExt.identityUuid] = agent;
      }
    }

    this.loading = false;
  }
}
