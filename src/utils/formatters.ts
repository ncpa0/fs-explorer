import { DateTime } from "luxon";

const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * 1024;
const GIGABYTE = MEGABYTE * 1024;
const TERABYTE = GIGABYTE * 1024;

export class Fmt {
  static size(size: number): string {
    if (size < KILOBYTE) {
      return `${size} B`;
    }
    if (size < MEGABYTE) {
      return `${(size / KILOBYTE).toFixed(2)} KB`;
    }
    if (size < GIGABYTE) {
      return `${(size / MEGABYTE).toFixed(2)} MB`;
    }
    if (size < TERABYTE) {
      return `${(size / GIGABYTE).toFixed(2)} GB`;
    }
    return `${(size / TERABYTE).toFixed(2)} TB`;
  }

  static date(date: number): string {
    const dt = DateTime.fromSeconds(date);
    return dt.toFormat("yyyy-MM-dd HH:mm:ss");
  }
}
