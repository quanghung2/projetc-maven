import {
  fileAsImage,
  fileAudio,
  fileCode,
  fileExcel,
  fileImage,
  filePdf,
  filePowerPoint,
  fileText,
  fileVideo,
  fileWord,
  fileZip
} from '@b3networks/shared/common';

export function getFileType(fileType: string): string {
  if (fileType) {
    fileType = fileType.toLowerCase();

    if (fileImage.indexOf(fileType) >= 0) {
      return 'assets/icons/attachment/image.png';
    }

    if (fileAsImage.indexOf(fileType) >= 0) {
      return 'assets/icons/attachment/image.png';
    }

    if (fileVideo.indexOf(fileType) >= 0) {
      return 'assets/icons/attachment/video.png';
    }

    if (fileAudio.indexOf(fileType) >= 0) {
      return 'assets/icons/attachment/audio.png';
    }

    if (fileWord.indexOf(fileType) >= 0) {
      return 'assets/icons/attachment/word.png';
    }

    if (fileExcel.indexOf(fileType) >= 0) {
      return 'assets/icons/attachment/excel.png';
    }

    if (filePowerPoint.indexOf(fileType) >= 0) {
      return 'assets/icons/attachment/power_point.png';
    }

    if (fileZip.indexOf(fileType) >= 0) {
      return 'assets/icons/attachment/archive.png';
    }

    if (filePdf.indexOf(fileType) >= 0) {
      return 'assets/icons/attachment/pdf.png';
    }

    if (fileText.indexOf(fileType) >= 0) {
      return 'assets/icons/attachment/text.png';
    }

    if (fileCode.indexOf(fileType) >= 0) {
      return 'assets/icons/attachment/code.png';
    }
    if (fileImage.indexOf(fileType) >= 0) {
      return 'assets/icons/attachment/image.png';
    }
  }

  return 'assets/icons/attachment/attach_file.png';
}
