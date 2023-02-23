import {
  Aggregation,
  ChartType,
  DataTableChartConfig,
  FieldValueFormat,
  MetricFieldType
} from '@b3networks/api/dashboard';
import { UserDatePipe } from '@b3networks/shared/auth';
import { DurationPipe } from '@b3networks/shared/common';
import { HashMap, Order } from '@datorama/akita';
import { ChartDataSets } from 'chart.js';
import { WidgetDataset } from '../../model/widget.model';
import { WidgetTransfomer } from './transformer';

declare let _: any;

export class DataTableWidgetTransformer implements WidgetTransfomer {
  constructor(private userDatePipe: UserDatePipe, private durationPipe: DurationPipe) {}

  extractLabels(widgetData: WidgetDataset): string[] {
    const config = widgetData.chartConfig as DataTableChartConfig;

    const labels = config.metrics.map(metric =>
      metric.label ? metric.label : metric.aggregation + (metric.field ? ` of ${metric.field}` : '')
    );
    if (!config.hideSplitField) {
      labels.unshift(config.label ? config.label : config.splitRowsField);
    }
    return labels;
  }

  buildData(widgetData: WidgetDataset): ChartDataSets {
    return <ChartDataSets>{
      id: widgetData.id,
      ...this.aggregate(widgetData),
      type: ChartType.dataTable
    };
  }

  private aggregate(widgetData: WidgetDataset): { data: any[]; fieldIndex: HashMap<number> } {
    const sortWidgetDataByReportOrder = [...widgetData.data].sort((a, b) => {
      if (a.variables && b.variables) {
        return a.variables['reportOrder'] - b.variables['reportOrder'];
      }
      return 0;
    });
    const config = widgetData.chartConfig as DataTableChartConfig;
    const groupedData = _.groupBy(sortWidgetDataByReportOrder, item => {
      const splitRowsFields = config.splitRowsField?.split('.');
      let splitRowsFieldValuee = item[splitRowsFields[0]];
      if (splitRowsFields.length > 1 && !!splitRowsFieldValuee) {
        for (let i = 1, max = splitRowsFields.length; i < max; i++) {
          if (!splitRowsFieldValuee) {
            return splitRowsFieldValuee;
          }
          splitRowsFieldValuee = splitRowsFieldValuee[splitRowsFields[i]];
        }
      }

      return splitRowsFieldValuee;
    });

    const fieldIndex = {};

    let rowIndex = 0;
    const rows: any[] = Object.keys(groupedData).map(slipRowFieldValue => {
      let columnIndex = config.hideSplitField ? 0 : 1;
      const row: any[] = config.metrics.map(metric => {
        if (rowIndex === 0) {
          console.log(`field ${metric.field} with index ${columnIndex}`);
          fieldIndex[metric.field] = columnIndex;

          columnIndex++;
        }

        const metricFields = metric.field.split('.'); // support metric field nested
        const metricLabels = metric.label.split('.'); // support metric label nested
        const values: any[] = groupedData[slipRowFieldValue].map(item => {
          let value = item[metricFields[0]] ?? item[metricLabels[0]];
          if (metricFields.length > 1 && !!value) {
            for (let i = 1, max = metricFields.length; i < max; i++) {
              if (!value) {
                return value;
              }
              value = value[metricFields[i]];
            }
          }
          return value;
        });

        let fieldValue: any;
        switch (metric.aggregation) {
          case Aggregation.sum:
            fieldValue = values.map(value => +value).reduce<number>((a, b) => a + b, 0);
            break;
          case Aggregation.count:
            fieldValue = values.length;
            break;
          case Aggregation.max:
            fieldValue = values.map(value => +value).sort((a, b) => b - a)[0];
            break;
          case Aggregation.min:
            fieldValue = values.map(value => +value).sort((a, b) => a - b)[0];
            break;
          case Aggregation.value:
            fieldValue = values.length ? values[0] : null;
            break;
          case Aggregation.average:
            const sum = values.map(value => +value).reduce<number>((a, b) => a + b, 0);
            fieldValue = values.length ? sum / values.length : null;
            break;
        }

        if (metric.type === MetricFieldType.duration) {
          fieldValue = this.durationPipe.transform(fieldValue, config.unit || 'millisecond');
        }
        return config.metrics[0].format === FieldValueFormat.orgTime
          ? this.userDatePipe.transform(fieldValue)
          : fieldValue;
      });
      rowIndex++;
      if (!config.hideSplitField) {
        row.unshift(slipRowFieldValue);
      }

      return row;
    });

    let data =
      config.metrics[0].format === FieldValueFormat.orgTime ? rows.sort((a, b) => b[1].localeCompare(a[1])) : rows;

    const sortBy = config.sortBy;
    if (sortBy) {
      const sortIndex = fieldIndex[sortBy];
      data.sort((a, b) => {
        return config.sortByOrder?.toLowerCase() === Order.DESC
          ? b[sortIndex] - a[sortIndex]
          : a[sortIndex] - b[sortIndex];
      });
    }

    if (config.showTotalRow && rows.length > 0) {
      const totalRecord = [];
      if (!config.hideSplitField) {
        totalRecord.push('Total');
      }

      const totalColumn = rows[0].length;
      for (let colIndex = !config.hideSplitField ? 1 : 0; colIndex < totalColumn; colIndex++) {
        if (!isNaN(+rows[0][colIndex])) {
          for (let i = 0; i < rows.length; i++) {
            totalRecord[colIndex] = totalRecord[colIndex] || 0;
            totalRecord[colIndex] += rows[i][colIndex];
          }
        } else {
          return null;
        }
      }
      rows.unshift(totalRecord);
    }

    // for NEA report, move 2 menu items to end of table
    //https://b3networks.atlassian.net/browse/UI-2121
    if (config.stickToBottom?.length > 0) {
      const stickyLabels = config.stickToBottom.map(l => l.toLowerCase());

      const normalData = data.filter(r => !stickyLabels.includes(String(r[0]).toLowerCase()));
      const stickedData = data.filter(r => stickyLabels.includes(String(r[0]).toLowerCase()));

      data = normalData;
      stickyLabels.forEach(label => {
        const row = stickedData.find(rx => String(rx[0]).toLowerCase() === label);
        if (row) {
          //use push when it's stick to bottom
          data.push(row);
        }
      });
    }

    return {
      data: data,
      fieldIndex: fieldIndex
    };
  }
}
