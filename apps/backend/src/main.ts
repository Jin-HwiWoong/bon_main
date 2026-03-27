import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import connectPgSimple from "connect-pg-simple";
import type { NextFunction, Response } from "express";
import session from "express-session";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter";
import type { RequestWithSession } from "./common/types/request-with-session";
import { appConfig } from "./config";
import { PG_POOL } from "./infrastructure/database/drizzle.constants";
import type { Pool } from "pg";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = appConfig.port;
  const pool = app.get<Pool>(PG_POOL);
  const PgStore = connectPgSimple(session);

  app.use(
    session({
      store: new PgStore({
        pool,
        tableName: appConfig.sessionTableName,
        createTableIfMissing: true
      }),
      secret: appConfig.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: appConfig.isProduction,
        maxAge: 1000 * 60 * 60 * 24 * 7
      }
    })
  );

  app.use((req: RequestWithSession, _res: Response, next: NextFunction) => {
    if (req.session) {
      req.session.cookie ??= {} as RequestWithSession["session"]["cookie"];
    }
    next();
  });

  app.enableCors({
    origin: true,
    credentials: true
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  await app.listen(port);
}

bootstrap();
