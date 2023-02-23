import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FunctionService } from '@b3networks/api/flow';
import { AppConfig, AppStateService } from '@b3networks/fi/flow/shared';

@Component({
  selector: 'b3n-fif-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss']
})
export class SettingComponent implements OnInit {
  constructor(
    private activatedRoute: ActivatedRoute,
    private functionService: FunctionService,
    private appStateService: AppStateService
  ) {
    const data = this.activatedRoute.snapshot.data;
    this.appStateService.setAppConfig(<AppConfig>{
      name: data['appName']
    });
  }

  ngOnInit(): void {
    this.functionService.getFunction().subscribe();
  }
}
