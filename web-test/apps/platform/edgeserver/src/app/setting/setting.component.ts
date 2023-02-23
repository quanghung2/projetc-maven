import { Component, OnInit } from '@angular/core';
import { Cluster, ClusterQuery, ClusterService, PreConfigService } from '@b3networks/api/edgeserver';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss']
})
export class SettingComponent extends DestroySubscriberComponent implements OnInit {
  clusters$: Observable<Cluster[]>;
  curCluster: Cluster;

  constructor(
    private clusterQuery: ClusterQuery,
    private clusterService: ClusterService,
    private preConfigService: PreConfigService
  ) {
    super();
  }

  ngOnInit(): void {
    this.clusters$ = this.clusterQuery.selectAll();

    this.clusterQuery
      .selectActive()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(cluster => {
        this.curCluster = cluster;
      });
  }

  onChangeCluster() {
    this.clusterService.selectCluster(this.curCluster);
    this.preConfigService.getPreConfig(this.curCluster.cluster).subscribe();
  }
}
