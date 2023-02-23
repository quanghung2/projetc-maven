import { Component, OnDestroy, OnInit } from '@angular/core';
import { CacheService, EventStreamService } from '../shared';

declare var jQuery: any;

@Component({
  selector: 'configure',
  templateUrl: './configure.component.html',
  styleUrls: ['./configure.component.scss']
})
export class ConfigureComponent implements OnInit, OnDestroy {
  loading = true;
  switchingAccount = true;

  constructor(private eventStreamService: EventStreamService, private cacheService: CacheService) {
    let cur = this.cacheService.get('user-info');
    if (cur) {
      this.loading = false;
    }

    cur = this.cacheService.get('current-account');
    if (cur) {
      this.switchingAccount = false;
    }

    this.eventStreamService.on('switch-account').subscribe(res => {
      this.switchingAccount = true;
    });

    this.eventStreamService.on('switched-account').subscribe(res => {
      this.switchingAccount = false;
      this.loading = false;
    });
  }

  ngOnInit() {}

  ngAfterViewInit() {}

  ngOnDestroy() {}
}
