#!/usr/bin/env ./node_modules/.bin/ts-node

import { generate } from '../commands/generate';

generate({ config: 'basketry.config.json' });
