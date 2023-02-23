import { ChartDataSets } from 'chart.js';
import { WidgetDataset } from '../../model/widget.model';

export interface WidgetTransfomer {
  extractLabels(widgetData: WidgetDataset): string[];

  buildData(widgetData: WidgetDataset, labels?: any[], utcOffset?: string): ChartDataSets;
}
