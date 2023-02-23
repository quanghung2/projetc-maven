import { KeyValue } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { debounceTime } from 'rxjs';
import { SearchBy, SearchQuery } from '../../settings/filter-setting.model';
import { FilterSettingQuery } from '../../settings/filter-setting.query';
import { FilterSettingService } from '../../settings/filter-setting.service';

@Component({
  selector: 'b3n-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent extends DestroySubscriberComponent {
  readonly searchList: KeyValue<SearchBy, string>[] = [
    { key: SearchBy.id, value: 'ID' },
    { key: SearchBy.domain, value: 'Domain' },
    { key: SearchBy.orgUuid, value: 'Organization UUID' },
    { key: SearchBy.titleDesc, value: 'Title & Description' }
  ];

  searchFG = this.fb.group({
    type: this.fb.control(this.filterQuery.getFilter()?.searchQuery?.type),
    value: this.fb.control('')
  });

  @Output() searchChanged = new EventEmitter<SearchQuery>();

  constructor(
    private filterQuery: FilterSettingQuery,
    private filterService: FilterSettingService,
    private fb: FormBuilder
  ) {
    super();
    this._handleSearchChange();
  }

  private _handleSearchChange() {
    this.searchFG
      .get('value')
      .valueChanges.pipe(debounceTime(300))
      .subscribe(() => {
        const { type, value } = this.searchFG.value;
        this.filterService.updateFilterSetting({ searchQuery: { type, value } });
      });
  }
}
