import { DistributionWorkforceService } from './distribution-workforce.service';

type RepositoryMock = {
  find: jest.Mock;
  findOne: jest.Mock;
  update: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
};

function repositoryMock(overrides: Partial<RepositoryMock> = {}) {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value) => value),
    ...overrides,
  } as RepositoryMock;
}

describe('DistributionWorkforceService 김중희 저장 회귀 테스트', () => {
  const companyId = 1;
  const employee = {
    id: 2,
    companyId,
    employeeName: '김중희',
  };
  const undergroundMemo = '2025-01 ~ 2026-06 작업실적입니다.';

  function createService() {
    const employeeRepository = repositoryMock();
    const certificateTypeRepository = repositoryMock({
      findOne: jest.fn(async ({ where }) => {
        if (where.certificateTypeName === '무정전') {
          return { id: 5, companyId, certificateTypeName: '무정전' };
        }
        if (where.certificateTypeName === '지중배전') {
          return { id: 6, companyId, certificateTypeName: '지중배전' };
        }
        return null;
      }),
    });
    const employeeCertificateRepository = repositoryMock();
    const distributionCertificateRepository = repositoryMock();
    const sequencesService = { issue: jest.fn() };
    const configService = { get: jest.fn((_key, fallback) => fallback) };
    const kepcoClient = { fetchQualifications: jest.fn() };

    const service = new DistributionWorkforceService(
      employeeRepository as never,
      certificateTypeRepository as never,
      employeeCertificateRepository as never,
      distributionCertificateRepository as never,
      sequencesService as never,
      configService as never,
      kepcoClient as never,
    );

    return {
      service,
      employeeCertificateRepository,
      distributionCertificateRepository,
    };
  }

  it('김중희 지중배전 5.9h 조회값을 null 없이 employee/distribution 양쪽에 저장한다', async () => {
    const {
      service,
      employeeCertificateRepository,
      distributionCertificateRepository,
    } = createService();

    employeeCertificateRepository.find.mockResolvedValue([
      {
        id: 33,
        companyId,
        employeeId: employee.id,
        certificateTypeId: 6,
        workHours: null,
        memo: null,
      },
      {
        id: 31,
        companyId,
        employeeId: employee.id,
        certificateTypeId: 6,
        workHours: '217.573',
        memo: '2000-01 ~ 2026-07 작업실적입니다.',
      },
    ]);
    distributionCertificateRepository.find.mockResolvedValue([
      {
        id: 2,
        companyId,
        employeeId: employee.id,
        employeeCertificateId: 31,
        qualificationName: '지중배전',
        workHours: null,
        lastFetchMessage: null,
      },
    ]);

    await (
      service as never as Record<string, Function>
    ).upsertTargetQualifications(
      companyId,
      employee,
      [
        {
          qualificationName: '지중배전',
          workHours: '5.9',
          memo: undergroundMemo,
        },
      ],
      '2025-01-01',
      '2026-06-03',
    );

    expect(employeeCertificateRepository.update).toHaveBeenCalledWith(
      { companyId, employeeId: employee.id, certificateTypeId: 6 },
      expect.objectContaining({
        workHours: '5.9',
        memo: undergroundMemo,
      }),
    );
    expect(distributionCertificateRepository.update).toHaveBeenCalledWith(
      { companyId, employeeId: employee.id, qualificationName: '지중배전' },
      expect.objectContaining({
        workHours: '5.9',
        lastFetchMessage: undergroundMemo,
      }),
    );
  });

  it('김중희 기존 유효 실적이 있으면 KEPCO 결과 누락으로 null 덮어쓰지 않는다', async () => {
    const {
      service,
      employeeCertificateRepository,
      distributionCertificateRepository,
    } = createService();

    employeeCertificateRepository.find.mockResolvedValue([
      {
        id: 33,
        companyId,
        employeeId: employee.id,
        certificateTypeId: 6,
        workHours: null,
        memo: null,
      },
      {
        id: 31,
        companyId,
        employeeId: employee.id,
        certificateTypeId: 6,
        workHours: '217.573',
        memo: '2000-01 ~ 2026-07 작업실적입니다.',
      },
    ]);
    distributionCertificateRepository.find.mockResolvedValue([
      {
        id: 2,
        companyId,
        employeeId: employee.id,
        employeeCertificateId: 31,
        qualificationName: '지중배전',
        workHours: '217.573',
        lastFetchMessage: '2000-01 ~ 2026-07 작업실적입니다.',
      },
    ]);

    await (
      service as never as Record<string, Function>
    ).upsertTargetQualifications(
      companyId,
      employee,
      [{ qualificationName: '지중배전', qualificationStatus: '정상' }],
      '2025-01-01',
      '2026-06-03',
    );

    expect(employeeCertificateRepository.update).toHaveBeenCalledWith(
      { companyId, employeeId: employee.id, certificateTypeId: 6 },
      expect.objectContaining({
        workHours: '217.573',
        memo: '2000-01 ~ 2026-07 작업실적입니다.',
      }),
    );
    expect(distributionCertificateRepository.update).toHaveBeenCalledWith(
      { companyId, employeeId: employee.id, qualificationName: '지중배전' },
      expect.objectContaining({
        workHours: '217.573',
        lastFetchMessage: '2000-01 ~ 2026-07 작업실적입니다.',
      }),
    );
  });
});
