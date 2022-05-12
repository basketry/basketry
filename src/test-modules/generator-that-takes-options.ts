import { Generator } from '../types';

const generator: Generator = (_, options) => {
  return [
    {
      path: ['with', 'options'],
      contents: JSON.stringify(options),
    },
  ];
};

export default generator;
