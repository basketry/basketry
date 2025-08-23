import path from 'path';
import {
  ParseRequest,
  ValidateRequest,
  GenerateRequest,
  ErrorResponse,
  ParseResponse,
  ValidateResponse,
  GenerateResponse,
  ErrorResponseId,
} from '@basketry/ir';
import { Generator, Parser, Rule } from './types';

export class RPC {
  constructor(
    private readonly plugins: {
      parser?: Parser;
      rule?: Rule;
      generator?: Generator;
    },
  ) {}

  async execute(): Promise<void> {
    const stdin = await this.readStdin();

    const req = this.parseRequest(stdin);

    if (!req) return;

    // TODO: validate request

    const id = req.id;

    switch (req.method) {
      case 'basketry.parse': {
        if (!this.plugins.parser) return this.methodNotFound(id);

        const absoluteSourcePath = path.resolve(
          req.params.basketry.projectDirectory,
          req.params.context.sourcePath,
        );

        const { service, violations } = await this.plugins.parser(
          req.params.context.sourceContent,
          absoluteSourcePath,
        );

        const res: ParseResponse = {
          jsonrpc: '2.0',
          id,
          result: {
            service,
            violations,
          },
        };

        return console.log(JSON.stringify(res));
      }
      case 'basketry.validate': {
        if (!this.plugins.rule) return this.methodNotFound(id);

        const violations = await this.plugins.rule(
          req.params.context.service,
          req.params.context.options,
        );

        const res: ValidateResponse = {
          jsonrpc: '2.0',
          id,
          result: {
            violations,
          },
        };

        return console.log(JSON.stringify(res));
      }
      case 'basketry.generate': {
        if (!this.plugins.generator) return this.methodNotFound(id);

        const files = await this.plugins.generator(
          req.params.context.service,
          req.params.context.options,
        );

        const res: GenerateResponse = {
          jsonrpc: '2.0',
          id,
          result: {
            files,
          },
        };

        return console.log(JSON.stringify(res));
      }
      default: {
        return this.methodNotFound(id);
      }
    }
  }

  private parseRequest(
    stdin: string,
  ): ParseRequest | ValidateRequest | GenerateRequest | undefined {
    try {
      const req = JSON.parse(stdin) as
        | ParseRequest
        | ValidateRequest
        | GenerateRequest;

      if (
        req.jsonrpc !== '2.0' ||
        (typeof req.id !== 'number' && typeof req.id !== 'string')
      ) {
        this.invalidRequest(null, 'Invalid request');
        return undefined;
      }

      return req;
    } catch (error) {
      this.parseError(null, 'Invalid JSON');
      return undefined;
    }
  }

  private methodNotFound(id: ErrorResponseId): void {
    const error: ErrorResponse = {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: 'Method not found',
      },
    };

    console.log(JSON.stringify(error));
  }

  private parseError(id: ErrorResponseId, message: string): void {
    const error: ErrorResponse = {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32700,
        message,
      },
    };

    console.log(JSON.stringify(error));
  }

  private invalidRequest(id: ErrorResponseId, message: string): void {
    const error: ErrorResponse = {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32600,
        message,
      },
    };
  }

  private readStdin(): Promise<string> {
    return new Promise((resolve, reject) => {
      let stdinData = '';
      process.stdin.setEncoding('utf8');

      process.stdin.on('data', (chunk) => {
        stdinData += chunk;
      });

      process.stdin.on('error', (err) => {
        reject(err);
      });

      process.stdin.on('end', () => {
        resolve(stdinData);
      });
    });
  }
}
