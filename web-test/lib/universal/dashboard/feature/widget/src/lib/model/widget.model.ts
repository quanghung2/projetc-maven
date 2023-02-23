import {
  ChartConfig,
  ChartType,
  DataTableChartConfig,
  MetricChartConfig,
  PieChartConfig
} from '@b3networks/api/dashboard';

export interface WidgetDataset {
  id?: string;
  chartType?: ChartType;
  chartConfig?: MetricChartConfig | DataTableChartConfig | PieChartConfig | ChartConfig;
  data: Array<any>;
}

export interface WidgetData {
  datasets: WidgetDataset[];
}
