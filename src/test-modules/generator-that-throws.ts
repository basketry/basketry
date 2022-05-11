import { Generator } from '../types';

const generator: Generator = () => {
  throw new Error('Test error');
};

export default generator;
