import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Dashboard2, Dashboard2Map, DashboardV2Service, DASHBOARD_TYPE } from '@b3networks/api/dashboard';
import { SelectDashboardForm } from '../public-device.component';

@Component({
  selector: 'b3n-select-dashboard',
  templateUrl: './select-dashboard.component.html',
  styleUrls: ['./select-dashboard.component.scss']
})
export class SelectDashboardComponent implements OnChanges {
  @Input() invalid: boolean;
  @Input() form: SelectDashboardForm;
  @Input() dashboard2s: Dashboard2[];
  @Input() dashboard2sFilter: Dashboard2[];
  @Input() dashboard2Map: Dashboard2Map;
  @Input() disableDashboardOptions: boolean;
  @Input() dashboardOptionLeft: number;
  @Output() dashboardOptionClick = new EventEmitter<string>();
  @Output() clearDashboardOptions = new EventEmitter<any>();

  readonly DASHBOARD_TYPE = DASHBOARD_TYPE;

  hasCustom: boolean;

  constructor(public dashboardV2Service: DashboardV2Service) {}

  ngOnChanges(_: SimpleChanges): void {
    this.hasCustom = !!this.dashboard2s.find(d => !d.isDefault);
  }

  get dashboardUuids() {
    return this.form.controls['dashboardUuids'];
  }
}
