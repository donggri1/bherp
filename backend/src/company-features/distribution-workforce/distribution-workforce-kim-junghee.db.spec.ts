import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import {
  createConnection,
  type Connection,
  type RowDataPacket,
} from 'mysql2/promise';

type EmployeeCertificateRow = RowDataPacket & {
  certificateTypeName: string;
  employeeCertificateId: number;
  workHours: string | null;
  memo: string | null;
};

type DistributionCertificateRow = RowDataPacket & {
  qualificationName: string;
  distributionCertificateId: number;
  workHours: string | null;
  lastFetchMessage: string | null;
};

const shouldRun = process.env.RUN_KIM_JUNGHEE_DB_TEST === '1';
const describeDb = shouldRun ? describe : describe.skip;

describeDb('김중희 배전기능인력 DB 저장값 검증', () => {
  jest.setTimeout(30_000);

  let connection: Connection;

  beforeAll(async () => {
    const env = loadEnv();
    connection = await createConnection({
      host: env.DB_HOST ?? 'localhost',
      port: Number(env.DB_PORT ?? 3306),
      user: requiredEnv(env, 'DB_USERNAME'),
      password: requiredEnv(env, 'DB_PASSWORD'),
      database: requiredEnv(env, 'DB_DATABASE'),
    });
  });

  afterAll(async () => {
    await connection?.end();
  });

  it('김중희 employee_certificates에 null/오인식 실적/기본 메모가 없어야 한다', async () => {
    const [rows] = await connection.execute<EmployeeCertificateRow[]>(
      `
        SELECT
          ct.certificateTypeName,
          ec.id AS employeeCertificateId,
          CAST(ec.workHours AS CHAR) AS workHours,
          ec.memo
        FROM employees e
        JOIN employee_certificates ec
          ON ec.employeeId = e.id
         AND ec.companyId = e.companyId
        JOIN certificate_types ct
          ON ct.id = ec.certificateTypeId
         AND ct.companyId = e.companyId
        WHERE e.employeeName = ?
          AND ct.certificateTypeName IN (?, ?)
        ORDER BY ct.certificateTypeName, ec.id
      `,
      ['김중희', '무정전', '지중배전'],
    );

    console.log('김중희 employee_certificates:', JSON.stringify(rows, null, 2));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((row) => row.certificateTypeName === '무정전')).toBe(true);
    expect(rows.some((row) => row.certificateTypeName === '지중배전')).toBe(
      true,
    );

    for (const row of rows) {
      expect(row.workHours).toEqual(
        expect.stringMatching(/^\d+(?:\.\d{1,3})?$/),
      );
      expect(row.workHours).not.toMatch(/^(24|2000|2025)(?:\.000)?$/);
      expect(row.memo).toEqual(expect.stringContaining('작업실적'));
      expect(row.memo).not.toBe('KEPCO 배전기능인력 조회 반영');
    }
  });

  it('김중희 distribution_workforce_certificates에 null/오인식 실적/기본 메모가 없어야 한다', async () => {
    const [rows] = await connection.execute<DistributionCertificateRow[]>(
      `
        SELECT
          dw.qualificationName,
          dw.id AS distributionCertificateId,
          CAST(dw.workHours AS CHAR) AS workHours,
          dw.lastFetchMessage
        FROM employees e
        JOIN distribution_workforce_certificates dw
          ON dw.employeeId = e.id
         AND dw.companyId = e.companyId
        WHERE e.employeeName = ?
          AND dw.qualificationName IN (?, ?)
        ORDER BY dw.qualificationName, dw.id
      `,
      ['김중희', '무정전', '지중배전'],
    );

    console.log(
      '김중희 distribution_workforce_certificates:',
      JSON.stringify(rows, null, 2),
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((row) => row.qualificationName === '무정전')).toBe(true);
    expect(rows.some((row) => row.qualificationName === '지중배전')).toBe(true);

    for (const row of rows) {
      expect(row.workHours).toEqual(
        expect.stringMatching(/^\d+(?:\.\d{1,3})?$/),
      );
      expect(row.workHours).not.toMatch(/^(24|2000|2025)(?:\.000)?$/);
      expect(row.lastFetchMessage).toEqual(expect.stringContaining('작업실적'));
      expect(row.lastFetchMessage).not.toBe('KEPCO 배전기능인력 조회 반영');
    }
  });
});

function loadEnv() {
  const envPath = [
    resolve(process.cwd(), '.env'),
    resolve(__dirname, '../../../.env'),
  ].find((candidate) => existsSync(candidate));
  const fileEnv = envPath ? parseEnvFile(readFileSync(envPath, 'utf8')) : {};
  return { ...fileEnv, ...process.env };
}

function parseEnvFile(value: string) {
  return Object.fromEntries(
    value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separatorIndex = line.indexOf('=');
        return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
      }),
  );
}

function requiredEnv(env: NodeJS.ProcessEnv, key: string) {
  const value = env[key];
  if (!value) throw new Error(`${key} 환경변수가 필요합니다.`);
  return value;
}
