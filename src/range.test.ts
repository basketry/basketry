import { decodeRange, encodeRange } from './range';

describe('encodeRange', () => {
  it('returns undefined when range is undefined', () => {
    // ARRANGE
    const sourceIndex = 0;
    const range = undefined;

    // ACT
    const result = encodeRange(sourceIndex, range);

    // ASSERT
    expect(result).toBeUndefined();
  });

  it('encodes with 3 segments (line;col;offset) when the start and end offsets are the same', () => {
    // ARRANGE
    const sourceIndex = 2;
    const range = {
      start: { line: 5, column: 34, offset: 240 },
      end: { line: 5, column: 34, offset: 240 },
    };

    // ACT
    const result = encodeRange(sourceIndex, range);

    // ASSERT
    expect(result).toBe('2:5;34;240');
  });

  it('encodes with 5 segments (line;col1;col2;offset1;offset2) when the start and end lines are the same', () => {
    // ARRANGE
    const sourceIndex = 7;
    const range = {
      start: { line: 5, column: 20, offset: 100 },
      end: { line: 5, column: 30, offset: 110 },
    };

    // ACT
    const result = encodeRange(sourceIndex, range);

    // ASSERT
    expect(result).toBe('7:5;20;30;100;110');
  });

  it('encodes with 6 segments (line1;col1;line2;col2;offset1;offset2) when the start and end lines are different', () => {
    // ARRANGE
    const sourceIndex = 5;
    const range = {
      start: { line: 5, column: 20, offset: 100 },
      end: { line: 6, column: 27, offset: 236 },
    };

    // ACT
    const result = encodeRange(sourceIndex, range);

    // ASSERT
    expect(result).toBe('5:5;20;6;27;100;236');
  });
});

describe('decodeRange', () => {
  it('returns the start of the first source doc when loc is undefined', () => {
    // ARRANGE
    const loc = undefined;

    // ACT
    const result = decodeRange(loc);

    // ASSERT
    expect(result).toEqual({
      range: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 1, offset: 0 },
      },
      sourceIndex: 0,
    });
  });

  it('decodes a 3 segment (line;col;offset) loc', () => {
    // ARRANGE
    const loc = '2:5;34;240';

    // ACT
    const result = decodeRange(loc);

    // ASSERT
    expect(result).toEqual({
      range: {
        start: { line: 5, column: 34, offset: 240 },
        end: { line: 5, column: 34, offset: 240 },
      },
      sourceIndex: 2,
    });
  });

  it('decodes a 5 segment (line;col1;col2;offset1;offset2) loc', () => {
    // ARRANGE
    const loc = '7:5;20;30;100;110';

    // ACT
    const result = decodeRange(loc);

    // ASSERT
    expect(result).toEqual({
      range: {
        start: { line: 5, column: 20, offset: 100 },
        end: { line: 5, column: 30, offset: 110 },
      },
      sourceIndex: 7,
    });
  });

  it('decodes a 6 segment (line1;col1;line2;col2;offset1;offset2) loc', () => {
    // ARRANGE
    const loc = '5:5;20;6;27;100;236';

    // ACT
    const result = decodeRange(loc);

    // ASSERT
    expect(result).toEqual({
      range: {
        start: { line: 5, column: 20, offset: 100 },
        end: { line: 6, column: 27, offset: 236 },
      },
      sourceIndex: 5,
    });
  });

  it('defaults to source doc index 0 if one is not encoded', () => {
    // ARRANGE
    const loc = '5;34;240';

    // ACT
    const result = decodeRange(loc);

    // ASSERT
    expect(result).toEqual({
      range: {
        start: { line: 5, column: 34, offset: 240 },
        end: { line: 5, column: 34, offset: 240 },
      },
      sourceIndex: 0,
    });
  });

  it('defaults to source doc index 0 if the encoded index is not a number', () => {
    // ARRANGE
    const loc = 'NaN:5;34;240';

    // ACT
    const result = decodeRange(loc);

    // ASSERT
    expect(result).toEqual({
      range: {
        start: { line: 5, column: 34, offset: 240 },
        end: { line: 5, column: 34, offset: 240 },
      },
      sourceIndex: 0,
    });
  });
});
