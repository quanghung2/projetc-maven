import { Aggregation, ChartConfig } from '@b3networks/api/dashboard';
import { ChartDataSets } from 'chart.js';
import { format, utcToZonedTime } from 'date-fns-tz';
import { WidgetDataset } from '../../model/widget.model';
import { WidgetTransfomer } from './transformer';

export interface Time {
  time: string;
  value: number;
}

export class ChartTransformer implements WidgetTransfomer {
  extractLabels(widgetDataset: WidgetDataset): string[] {
    return [widgetDataset.chartConfig.label];
  }

  buildData(widgetData: WidgetDataset, labels: string[], utcOffset: string): ChartDataSets {
    return <ChartDataSets>{
      data: this.aggregate(widgetData, labels, utcOffset),
      label: widgetData.chartConfig.label,
      borderWidth: 1,
      fill: false
    };
  }

  private aggregate(widgetDataset: WidgetDataset, labels: string[], utcOffset: string): number[] {
    const config = widgetDataset.chartConfig as ChartConfig;
    const splitField = config.splitField.replace('.', '');

    let result: number[];
    const initDataWithTime = labels.map(label => <Time>{ time: label, value: 0 });
    const datasetData = widgetDataset.data.map(
      metric =>
        <Time>{
          time: format(utcToZonedTime(new Date(metric[splitField]), utcOffset || '+0800'), 'HH:mm'),
          value: metric.value
        }
    );

    const mapData = new Map();
    datasetData.forEach(timeObj => {
      const key = timeObj.time;
      const value = timeObj.value;
      if (!mapData.has(key)) {
        if (config.aggregation === Aggregation.count) {
          mapData.set(key, 1);
        } else {
          mapData.set(key, value);
        }
      } else {
        switch (config.aggregation) {
          case Aggregation.sum: {
            mapData.set(key, mapData.get(key) + value);
            break;
          }
          case Aggregation.max: {
            mapData.set(key, mapData.get(key) > value ? mapData.get(key) : value);
            break;
          }
          case Aggregation.min: {
            mapData.set(key, mapData.get(key) < value ? mapData.get(key) : value);
            break;
          }
          case Aggregation.count: {
            mapData.set(key, mapData.get(key) + 1);
          }
        }
      }
    });
    const uniqDatasetDataByTime = [];
    mapData.forEach((value, key) => {
      uniqDatasetDataByTime.push(<Time>{ time: key, value: value });
    });

    const dataMapping = uniqDatasetDataByTime.reduce((map, timeObj) => {
      map[timeObj.time] = timeObj.value;
      return map;
    }, {});

    result = initDataWithTime.map((timeObj, index) => {
      if (dataMapping[timeObj.time]) {
        initDataWithTime[index].value = dataMapping[timeObj.time];
      }
      return timeObj.value;
    });

    return result;
  }
}
