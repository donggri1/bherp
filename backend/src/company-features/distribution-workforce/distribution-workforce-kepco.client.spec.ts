import { DistributionWorkforceKepcoClient } from './distribution-workforce-kepco.client';

describe('DistributionWorkforceKepcoClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('sends KEPCO work period as YYYY-MM even when the API receives dates', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        headers: {
          get: jest.fn().mockReturnValue('JSESSIONID=test; Path=/'),
        },
        ok: true,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(`
          <table>
            <tr>
              <th scope="row">지중배전전공 실적</th>
              <td><b>11.8h</b><small>2025-01 ~ 2026-07 작업실적입니다.</small></td>
            </tr>
          </table>
        `),
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = new DistributionWorkforceKepcoClient();
    await client.fetchQualifications({
      employeeName: '김중희',
      birthDate: '19800303',
      certificateNo: '25059103694',
      periodFrom: '2025-01-01',
      periodTo: '2026-07-03',
    });

    const [, postCall] = fetchMock.mock.calls;
    const body = postCall[1]?.body as URLSearchParams;
    expect(body.get('skillSdate')).toBe('2025-01');
    expect(body.get('skillEdate')).toBe('2026-07');
  });
});
