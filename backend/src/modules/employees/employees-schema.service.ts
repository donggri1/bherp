import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

type EmployeeColumnSpec = {
  name: string;
  definition: string;
};

const EMPLOYEE_PROFILE_COLUMNS: EmployeeColumnSpec[] = [
  { name: 'email', definition: 'varchar(120) NULL' },
  { name: 'phone', definition: 'varchar(30) NULL' },
  { name: 'address', definition: 'varchar(255) NULL' },
  { name: 'residentRegistrationNumber', definition: 'varchar(20) NULL' },
];

@Injectable()
export class EmployeesSchemaService implements OnModuleInit {
  private readonly logger = new Logger(EmployeesSchemaService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    if (this.dataSource.options.type !== 'mysql') return;

    for (const column of EMPLOYEE_PROFILE_COLUMNS) {
      await this.ensureColumn(column);
    }
  }

  private async ensureColumn(column: EmployeeColumnSpec) {
    const rows = await this.dataSource.query(
      `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
        LIMIT 1
      `,
      ['employees', column.name],
    );

    if (rows.length) return;

    await this.dataSource.query(
      `ALTER TABLE employees ADD COLUMN \`${column.name}\` ${column.definition}`,
    );
    this.logger.log(`Added missing employees.${column.name} column`);
  }
}
