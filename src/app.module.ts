/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { EstadoCivilModule } from './configuracoes/estado-civil/estado-civil.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EscolaridadeModule } from './configuracoes/escolaridade/escolaridade.module.js';
import { EnderecoModule } from './endereco/endereco.module.js';
import { PessoaModule } from './pessoa/pessoa.module.js';
import { TipoDioceseModule } from './configuracoes/tipo-diocese/tipo-diocese.module.js';
import { ConfiguracoesModule } from './configuracoes/configuracoes.module.js';
import { ParoquiaModule } from './paroquia/paroquia.module.js';
import { LocalidadeModule } from './localidade/localidade.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { PaginationInterceptor } from './commons/interceptors/pagination.interceptors.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CaslModule } from './casl/casl.module.js';
import { PrismaExceptionsFilter } from './commons/exceptions/prisma-exceptions/prisma-exceptions.filter.js';
import { LoggingInterceptor } from './commons/interceptors/logging.interceptor.js';
import { SetorModule } from './mapa/setor/setor.module.js';
import { MacroRegiaoModule } from './mapa/macro-regiao/macro-regiao.module.js';
import { SaoPedroModule } from './external/sao-pedro/sao-pedro.module.js';
import { LoggerModule } from 'nestjs-pino';
import { IncomingMessage, ServerResponse } from 'http';
import { RegiaoModule } from './mapa/regiao/regiao.module.js';
import { EquipeModule } from './equipe/equipe.module.js';
import { CarismaModule } from './carisma/carisma.module.js';
import { ExternalModule } from './external/external.module.js';
import { HealthModule } from './health/health.module.js';
import { ResendModule } from 'nestjs-resend';
import * as rTracer from 'cls-rtracer';
import { ComunidadeModule } from './comunidade/comunidade.module.js';
import { MaintenanceModule } from './maintenance/maintenance.module.js';

const isElkEnabled = process.env.ELK_ENABLED === 'true';
const elkLogFile =
  process.env.ELK_LOG_FILE ?? './infra/runtime-logs/ambrosio.log';

function extractRequestBody(req: any): unknown {
  return req?.body ?? req?.raw?.body;
}

function stringifyRequestBody(body: unknown): string | undefined {
  if (typeof body === 'undefined') {
    return undefined;
  }

  if (typeof body === 'string') {
    return body;
  }

  try {
    return JSON.stringify(body);
  } catch {
    return '[unserializable-body]';
  }
}

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level:
          process.env.NODE_ENV === 'test'
            ? 'silent'
            : process.env.NODE_ENV === 'production'
              ? 'info'
              : 'debug',
        transport: isElkEnabled
          ? {
              target: 'pino/file',
              options: {
                destination: elkLogFile,
                mkdir: true,
              },
            }
          : {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
                singleLine: false,
                // Highlight errors
                customColors: `err:red,statusCode:\\d{5}\\d?:yellow,statusCode:[4]\\d{2}:yellow,statusCode:[5]\\d{2}:red`,
              },
            },
        genReqId: (
          req: IncomingMessage,
          res: ServerResponse<IncomingMessage>,
        ): string => {
          const id = rTracer.id();
          if (id) return String(id);
          if ('id' in req && typeof (req as any).id !== 'undefined') {
            return String((req as any).id);
          }
          return crypto.randomUUID();
        },
        serializers: {
          req: (req: any): Record<string, any> => {
            const requestBody = extractRequestBody(req);

            return {
              id: req.id,
              method: req.method,
              url: req.url,
              query: req.query,
              params: req.params,
              headers: req.headers,
              body: requestBody,
              requestBody: stringifyRequestBody(requestBody),
              remoteAddress: req.remoteAddress,
              remotePort: req.remotePort,
            };
          },
        },
        customProps: (req): Record<string, any> => {
          const requestBody = extractRequestBody(req);

          return {
            context: 'HTTP',
            elkEnabled: isElkEnabled,
            requestId: rTracer.id?.(),
            body: requestBody,
            requestBody: stringifyRequestBody(requestBody),
          };
        },
      },
    }),
    ResendModule.forRoot({
      apiKey: process.env.RESEND_API_KEY,
    }),
    SentryModule.forRoot(),
    ScheduleModule.forRoot(),
    EstadoCivilModule,
    PrismaModule,
    EscolaridadeModule,
    EnderecoModule,
    PessoaModule,
    TipoDioceseModule,
    ConfiguracoesModule,
    ParoquiaModule,
    LocalidadeModule,
    UsersModule,
    AuthModule,
    CaslModule,
    SetorModule,
    MacroRegiaoModule,
    SaoPedroModule,
    RegiaoModule,
    ComunidadeModule,
    EquipeModule,
    CarismaModule,
    ExternalModule,
    HealthModule,
    MaintenanceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaExceptionsFilter,
    SentryGlobalFilter,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PaginationInterceptor,
    },
  ],
})
export class AppModule {}
