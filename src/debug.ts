import { Generator } from './types';

const debug: Generator = (service) => [
  {
    path: [`__debug-v${service.majorVersion.value}__.json`],
    contents: JSON.stringify(service, null, 2),
  },
];

export default debug;
