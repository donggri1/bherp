import { EmployeeCertificatesService } from './employee-certificates.service';

function repositoryMock() {
  return {
    create: jest.fn((value) => value),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
}

describe('EmployeeCertificatesService', () => {
  it('같은 김중희 자격을 다시 생성해도 null 중복 행을 새로 만들지 않고 기존 유효값을 보존한다', async () => {
    const repository = repositoryMock();
    const service = new EmployeeCertificatesService(repository as never);

    repository.find.mockResolvedValue([
      {
        id: 35,
        companyId: 1,
        employeeId: 2,
        certificateTypeId: 6,
        workHours: null,
        memo: null,
        isActive: true,
      },
      {
        id: 31,
        companyId: 1,
        employeeId: 2,
        certificateTypeId: 6,
        workHours: '217.573',
        memo: '2000-01 ~ 2026-07 작업실적입니다.',
        isActive: true,
      },
    ]);
    repository.findOne.mockResolvedValue({
      id: 35,
      companyId: 1,
      employeeId: 2,
      certificateTypeId: 6,
      workHours: '217.573',
      memo: '2000-01 ~ 2026-07 작업실적입니다.',
    });

    await service.create(1, {
      employeeId: 2,
      certificateTypeId: 6,
      isActive: true,
    });

    expect(repository.save).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(
      { companyId: 1, employeeId: 2, certificateTypeId: 6 },
      expect.objectContaining({
        workHours: '217.573',
        memo: '2000-01 ~ 2026-07 작업실적입니다.',
      }),
    );
  });
});
