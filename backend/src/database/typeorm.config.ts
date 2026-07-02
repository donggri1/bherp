import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get<string>('database.host', 'localhost'),
  port: configService.get<number>('database.port', 3306),
  username: configService.get<string>('database.username', 'root'),
  password: configService.get<string>('database.password', ''),
  database: configService.get<string>('database.database', 'erp_system'),
  autoLoadEntities: true,
  synchronize: configService.get<string>('app.nodeEnv') !== 'production',
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
