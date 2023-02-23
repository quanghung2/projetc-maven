import { Aggregation, ChartType, MetricChartConfig, MetricFieldType } from '@b3networks/api/dashboard';
import { DurationPipe } from '@b3networks/shared/common';
import { ChartDataSets } from 'chart.js';
import { WidgetDataset } from '../../model/widget.model';
import { WidgetTransfomer } from './transformer';

export class MetricWidgetTransformer implements WidgetTransfomer {
  constructor(private durationPipe: DurationPipe) {}

  extractLabels(widgetData: WidgetDataset): string[] {
    const config = widgetData.chartConfig as MetricChartConfig;
    return [config.label];
  }

  buildData(widgetData: WidgetDataset): ChartDataSets {
    const config = widgetData.chartConfig as MetricChartConfig;
    return <ChartDataSets>{
      id: widgetData.id,
      label: config.label,
      data: this.aggregate(widgetData),
      type: ChartType.metric
    };
  }

  private aggregate(widgetData: WidgetDataset): any[] {
    const config = widgetData.chartConfig as MetricChartConfig;
    let result: string | number;
    const values: number[] = widgetData.data.map(item => +item[config.field]);

    switch (config.aggregation) {
      case Aggregation.sum:
        result = values.reduce<number>((a, b) => a + b, 0);
        break;
      case Aggregation.count:
        result = values.length;
        break;
      case Aggregation.max:
        result = values.sort((a, b) => a - b)[0];
        break;
      case Aggregation.min:
        result = values.sort((a, b) => b - a)[0];
        break;
      case Aggregation.value:
        result = values[0];
        break;
    }

    if (config.type === MetricFieldType.duration) {
      result = this.durationPipe.transform(+result, config.unit || 'millisecond');
    }
    return [result];
  }
}
