import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectionListChange } from '@angular/material/list';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSelect } from '@angular/material/select';
import { Router } from '@angular/router';
import {
  Channel,
  ChannelHyperspace,
  ChannelHyperspaceQuery,
  ChannelHyperspaceService,
  Hyperspace,
  HyperspaceQuery,
  HyperspaceService,
  MappingHyperData,
  MeQuery,
  Privacy,
  User
} from '@b3networks/api/workspace';
import { ConvoHelperService, CreateChannelHyperComponent, CreateChannelHyperInput } from '@b3networks/chat/shared/core';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { forkJoin, Observable } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';

interface ResultChannel {
  channel: Channel[];
  user: User[];
}

const DEFAULT_SIZE = 20;
const DEFAULT_CHANNEL_SIZE = 30;

@Component({
  selector: 'b3n-hyperspace-quick-search',
  templateUrl: './hyperspace-quick-search.component.html',
  styleUrls: ['./hyperspace-quick-search.component.scss']
})
export class HyperspaceQuickSearchComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild('inputSearch') inputSearch: ElementRef;
  @ViewChild('selectionList') selectionList: MatSelect;
  @ViewChild(MatMenuTrigger) matMenuTrigger: MatMenuTrigger;

  @Input() hyper: Hyperspace;

  searchCtr: UntypedFormControl = this.fb.control('');
  valueSelectedCtr: UntypedFormControl = this.fb.control([]);
  filteredChannel$: Observable<ChannelHyperspace[]>;
  loadingChannel$: Observable<boolean>;

  readonly Privacy = Privacy;

  constructor(
    private fb: UntypedFormBuilder,
    private dialog: MatDialog,
    private convoHelperService: ConvoHelperService,
    private router: Router,
    private hyperspaceQuery: HyperspaceQuery,
    private hyperspaceService: HyperspaceService,
    private channelHyperspaceQuery: ChannelHyperspaceQuery,
    private channelHyperspaceService: ChannelHyperspaceService,
    private meQuery: MeQuery
  ) {
    super();
  }

  ngOnInit() {
    this.loadingChannel$ = this.hyperspaceQuery
      .selectUIState(this.hyper.id, 'loadedMines')
      .pipe(map(loadedMines => !loadedMines));
    this.filteredChannel$ = this.searchCtr.valueChanges.pipe(
      startWith(''),
      takeUntil(this.destroySubscriber$),
      map(value =>
        value?.trim()
          ? this.sortChannels(
              this.convoHelperService
                .getChannelsHyperspaceContainsByQuickSearch(
                  this.hyper.hyperspaceId,
                  value?.trim(),
                  DEFAULT_CHANNEL_SIZE,
                  {
                    keys: ['displayName']
                  }
                )
                ?.result?.map(x => x?.item) || []
            )
          : this.channelHyperspaceQuery.getAll({
              filterBy: entity =>
                entity.hyperspaceId === this.hyper.hyperspaceId && entity.isGroupChat && !!entity.displayName
            })
      )
    );
  }

  trackByChannel(_, item: ChannelHyperspace) {
    return item?.id;
  }

  toggleView($event: Event) {
    $event.stopPropagation();
  }

  menuClosed() {
    this.searchCtr.setValue('');
  }

  menuOpened() {
    this.searchCtr.setValue('');
    this.inputSearch?.nativeElement?.focus();

    const isLoadedMines = this.hyperspaceQuery.getUIState(this.hyper.id, 'loadedMines');
    if (!isLoadedMines) {
      forkJoin([
        this.channelHyperspaceService.getPublicChannels(this.hyper.hyperspaceId),
        this.channelHyperspaceService.getMines(this.hyper.hyperspaceId, <MappingHyperData>{
          meUuid: this.meQuery.getMe().userUuid,
          currentOrg: X.orgUuid
        })
      ]).subscribe(() => this.hyperspaceService.updateHyperspaceViewState(this.hyper.id, { loadedMines: true }));
    }
  }

  focusSelectionList(event) {
    if (this.selectionList && event.key === 'ArrowDown' && !this.selectionList.focused) {
      event.preventDefault();
      this.selectionList.focus();
    }
  }

  openCreateChannel() {
    this.dialog.open(CreateChannelHyperComponent, {
      data: <CreateChannelHyperInput>{
        key: this.searchCtr.value || '',
        hyperspace: this.hyper
      },
      disableClose: true
    });
  }

  onSelect($event: MatSelectionListChange) {
    if (!$event?.options?.length) {
      return;
    }

    const data = $event.options[0].value;
    this.router.navigate(['hyperspace', this.hyper.hyperspaceId, data.id]);
    this.triggerCloseMenu();
    this.valueSelectedCtr.setValue([]);
  }

  private triggerCloseMenu() {
    this.matMenuTrigger.closeMenu();
    this.searchCtr.setValue('');
  }

  private sortChannels(channels: ChannelHyperspace[]) {
    return channels.sort((a, b) => (a.isGroupChat === b.isGroupChat ? 0 : a.isGroupChat ? 1 : -1));
  }
}
