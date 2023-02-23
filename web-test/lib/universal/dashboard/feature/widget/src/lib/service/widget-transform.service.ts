import { Injectable } from '@angular/core';
import { IdentityProfileQuery, ProfileOrg } from '@b3networks/api/auth';
import { ChartConfig, ChartType } from '@b3networks/api/dashboard';
import { UserDatePipe } from '@b3networks/shared/auth';
import { DurationPipe, X } from '@b3networks/shared/common';
import { ChartData } from 'chart.js';
import { format, utcToZonedTime } from 'date-fns-tz';
import * as _ from 'lodash';
import { WidgetData } from '../model/widget.model';
import { ChartTransformer } from './transformer/chart.transformer';
import { DataTableWidgetTransformer } from './transformer/data-table.tranformer';
import { MetricWidgetTransformer } from './transformer/metric.tranformer';
import { MetricsWidgetTransformer } from './transformer/metrics.tranformer';
import { PieWidgetTransformer } from './transformer/pie.transformer';
import { WidgetTransfomer } from './transformer/transformer';
@Injectable({ providedIn: 'root' })
export class WidgetTransformService {
  organization: ProfileOrg;

  constructor(
    private profileQuery: IdentityProfileQuery,
    private userDatePipe: UserDatePipe,
    private durationPipe: DurationPipe
  ) {
    this.profileQuery.selectProfileOrg(X.orgUuid).subscribe(org => (this.organization = org));
  }

  buildChartData(data: WidgetData): ChartData {
    if (!data || data.datasets.length === 0) {
      return {};
    }

    const dataset = data.datasets[0];
    if (!dataset) {
      return {};
    }

    if ([ChartType.dataTable, ChartType.metric, ChartType.metrics].indexOf(dataset.chartType) > -1) {
      const datasets = data.datasets.map(d => {
        return this.getTransfomer(d.chartType).buildData(d);
      });

      return <ChartData>{
        labels: this.getTransfomer(data.datasets[0].chartType).extractLabels(data.datasets[0]),
        datasets: datasets
      };
    } else if ([ChartType.pie].indexOf(dataset.chartType) > -1) {
      const transform = this.getTransfomer(dataset.chartType) as PieWidgetTransformer;

      return <ChartData>{
        labels: transform.extractLabels(dataset),
        datasets: [transform.buildData(dataset)]
      };
    } else {
      this.getDisplayLabels(data);
      const datasets = data.datasets.map(d => {
        return this.getTransfomer(d.chartType).buildData(d, this.getDisplayLabels(data), this.organization.utcOffset);
      });

      return <ChartData>{
        labels: this.getDisplayLabels(data),
        datasets: datasets
      };
    }
  }

  private getTransfomer(chartType: ChartType) {
    let tranformer: WidgetTransfomer;
    switch (chartType) {
      case ChartType.metric:
        tranformer = new MetricWidgetTransformer(this.durationPipe);
        break;
      case ChartType.metrics:
        tranformer = new MetricsWidgetTransformer();
        break;
      case ChartType.dataTable:
        tranformer = new DataTableWidgetTransformer(this.userDatePipe, this.durationPipe);
        break;
      case ChartType.line: {
        tranformer = new ChartTransformer();
        break;
      }
      case ChartType.bar: {
        tranformer = new ChartTransformer();
        break;
      }
      case ChartType.pie: {
        tranformer = new PieWidgetTransformer();
        break;
      }
      case ChartType.doughnut: {
        tranformer = new ChartTransformer();
        break;
      }
    }

    return tranformer;
  }

  getDisplayLabels(data: WidgetData): string[] {
    const config = data.datasets[0].chartConfig as ChartConfig;
    const splitField = config.splitField?.replace('.', '');
    if (!!splitField) {
      const metricDataWithMaxLength = _.maxBy(data.datasets, function (o) {
        return o.data.length;
      }).data;
      const labels = metricDataWithMaxLength.map(metric =>
        format(utcToZonedTime(new Date(metric[splitField]), this.organization.utcOffset || '+0800'), 'HH:mm')
      );
      return _.uniq(labels);
    }
    return [];
  }
}
