import { Component } from '@angular/core';
import { CacheService, EventStreamService } from '../shared';

declare let jQuery: any;

@Component({
  selector: 'admin-tools',
  templateUrl: './admin-tools.component.html',
  styleUrls: ['./admin-tools.component.scss']
})
export class AdminToolsComponent {
  loading = true;

  constructor(eventStreamService: EventStreamService, cacheService: CacheService) {}
}
