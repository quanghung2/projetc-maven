import { ChartType } from '@b3networks/api/dashboard';
import { ChartDataSets } from 'chart.js';
import { WidgetDataset } from '../../model/widget.model';
import { WidgetTransfomer } from './transformer';

export class PieWidgetTransformer implements WidgetTransfomer {
  extractLabels(widgetData: WidgetDataset): string[] {
    const data = (widgetData.data as any).data;
    const labels = Object.keys(data);

    return labels;
  }

  buildData(widgetData: WidgetDataset): ChartDataSets {
    return <ChartDataSets>{
      id: widgetData.id,
      data: this.aggregate(widgetData),
      type: ChartType.pie
    };
  }

  private aggregate(widgetData: WidgetDataset): any[] {
    const data: number[] = Object.values((widgetData.data as any).data);
    const sum = data.reduce((prev, curr) => +prev + +curr, 0);
    const row = data.map(pie => {
      return ((pie * 100) / sum).toFixed(2);
    });

    return row;
  }
}
