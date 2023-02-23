import { Aggregation, ChartType, MetricsChartConfig } from '@b3networks/api/dashboard';
import { ChartDataSets } from 'chart.js';
import { WidgetDataset } from '../../model/widget.model';
import { WidgetTransfomer } from './transformer';

export class MetricsWidgetTransformer implements WidgetTransfomer {
  extractLabels(widgetData: WidgetDataset): string[] {
    const config = widgetData.chartConfig as MetricsChartConfig;
    const labels = config.metrics.map(m => m.label);
    return labels;
  }

  buildData(widgetData: WidgetDataset): ChartDataSets {
    const configs = widgetData.chartConfig as MetricsChartConfig;
    return <ChartDataSets>{
      id: widgetData.id,
      data: this.aggregate(widgetData),
      type: ChartType.metrics
    };
  }

  private aggregate(widgetData: WidgetDataset): any[] {
    const config = widgetData.chartConfig as MetricsChartConfig;
    const row: any[] = config.metrics.map(metric => {
      const values: number[] = widgetData.data.map(item => +item[metric.field]);
      let fieldValue: any;
      switch (metric.aggregation) {
        case Aggregation.sum:
          fieldValue = values.reduce<number>((a, b) => a + b, 0);
          break;
        case Aggregation.count:
          fieldValue = values.length;
          break;
        case Aggregation.max:
          fieldValue = values.sort((a, b) => b - a)[0];
          break;
        case Aggregation.min:
          fieldValue = values.sort((a, b) => a - b)[0];
          break;
        case Aggregation.value:
          // const d = groupedData[slipRowFieldValue];
          // fieldValue = !!d ? d[0][metric.field] : null;
          break;
      }
      return fieldValue;
    });

    return row;
  }
}
