import { Pipe, PipeTransform } from '@angular/core';

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

@Pipe({
  name: 'fileSize'
})
export class FileSizePipe implements PipeTransform {
  transform(sizeInBytes: number): string {
    if (!sizeInBytes) {
      return null;
    }

    let power = Math.round(Math.log(sizeInBytes) / Math.log(1024));
    power = Math.min(power, SIZE_UNITS.length - 1);

    const size = sizeInBytes / Math.pow(1024, power);
    const formattedSize = Math.round(size * 100) / 100;

    return `${formattedSize} ${SIZE_UNITS[power]}`;
  }
}
