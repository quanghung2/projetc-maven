export class BackupFile {
  constructor(public dateStr?: string, public zipParts: ZipPart[] = []) {}
}

export class ZipPart {
  constructor(public part?: number, public url?: string) {}
}
