import { Range } from './types';

// eslint-disable-next-line no-redeclare
export function encodeRange(sourceIndex: number, range: Range): string;
// eslint-disable-next-line no-redeclare
export function encodeRange(
  sourceIndex: number,
  range: Range | null | undefined,
): string | undefined;
// eslint-disable-next-line no-redeclare
export function encodeRange(
  sourceIndex: number,
  range: Range | null | undefined,
): string | undefined {
  if (!range) return undefined;

  function withDoc(...parts: number[]): string {
    return `${Math.max(0, sourceIndex)}:${parts.join(';')}`;
  }

  if (range.start.offset === range.end.offset) {
    return withDoc(range.start.line, range.start.column, range.start.offset);
  } else if (range.start.line === range.end.line) {
    return withDoc(
      range.start.line,
      range.start.column,
      range.end.column,
      range.start.offset,
      range.end.offset,
    );
  } else {
    return withDoc(
      range.start.line,
      range.start.column,
      range.end.line,
      range.end.column,
      range.start.offset,
      range.end.offset,
    );
  }
}

export function decodeRange(range: string | null | undefined): {
  range: Range;
  sourceIndex: number;
} {
  if (!range) return decodeRange('0:1;1;0');

  const [a, b] = range.split(':');

  const ixPart = Number(b ? a : '0');
  const rangePart = b ? b : a;

  const sourceIndex = Math.max(0, Number.isNaN(ixPart) ? 0 : ixPart);

  const parts = rangePart.split(';').map((x) => Number(x));

  if (parts.length === 6) {
    return {
      range: {
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
      },
      sourceIndex,
    };
  } else if (parts.length === 5) {
    return {
      range: {
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
      },
      sourceIndex,
    };
  } else {
    return {
      range: {
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
      },
      sourceIndex,
    };
  }
}
