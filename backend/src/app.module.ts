import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { DevSeedModule } from './database/seeds/dev-seed.module';
import { getTypeOrmConfig } from './database/typeorm.config';
import { AppSettingsModule } from './modules/app-settings/app-settings.module';
import { AuthModule } from './modules/auth/auth.module';
import { BusinessRegistrationsModule } from './modules/business-registrations/business-registrations.module';
import { BusinessUnitsModule } from './modules/business-units/business-units.module';
import { CertificateTypesModule } from './modules/certificate-types/certificate-types.module';
import { CommonCodesModule } from './modules/common-codes/common-codes.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { EmployeeCertificatesModule } from './modules/employee-certificates/employee-certificates.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { MenusModule } from './modules/menus/menus.module';
import { PositionsModule } from './modules/positions/positions.module';
import { RolesModule } from './modules/roles/roles.module';
import { SequencesModule } from './modules/sequences/sequences.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig, jwtConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    AuthModule,
    CompaniesModule,
    BusinessRegistrationsModule,
    BusinessUnitsModule,
    CertificateTypesModule,
    DepartmentsModule,
    PositionsModule,
    UsersModule,
    EmployeesModule,
    EmployeeCertificatesModule,
    AppSettingsModule,
    RolesModule,
    MenusModule,
    CommonCodesModule,
    SequencesModule,
    DevSeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
