import { Range } from './types';

export function encodeRange<T extends Range | null | undefined>(
  range: T,
): typeof range extends null | undefined ? undefined : string {
  return innerEncodeRange(range) as any;
}

function innerEncodeRange(range: Range | null | undefined): string | undefined {
  if (!range) return undefined;
  if (range.start.offset === range.end.offset) {
    return [range.start.line, range.start.column, range.start.offset].join(';');
  } else if (range.start.line === range.end.line) {
    return [
      range.start.line,
      range.start.column,
      range.end.column,
      range.start.offset,
      range.end.offset,
    ].join(';');
  } else {
    return [
      range.start.line,
      range.start.column,
      range.end.line,
      range.end.column,
      range.start.offset,
      range.end.offset,
    ].join(';');
  }
}

export function decodeRange(range: string | null | undefined): Range {
  if (!range) return decodeRange('1;1;0');

  const parts = range.split(';').map((x) => Number(x));

  if (parts.length === 6) {
    return {
      start: {
        line: parts[0],
        column: parts[1],
        offset: parts[4],
      },
      end: {
        line: parts[2],
        column: parts[3],
        offset: parts[5],
      },
    };
  } else if (parts.length === 5) {
    return {
      start: {
        line: parts[0],
        column: parts[1],
        offset: parts[3],
      },
      end: {
        line: parts[0],
        column: parts[2],
        offset: parts[4],
      },
    };
  } else {
    return {
      start: {
        line: parts[0],
        column: parts[1],
        offset: parts[2],
      },
      end: {
        line: parts[0],
        column: parts[1],
        offset: parts[2],
      },
    };
  }
}
