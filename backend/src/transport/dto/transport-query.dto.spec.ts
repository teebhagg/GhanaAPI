import { ValidationPipe } from '@nestjs/common';
import { NearbyStopsQueryDto } from './nearby-stops.dto';
import { RouteCalculationQueryDto } from './route-calculation.dto';
import { TravelCostQueryDto } from './travel-cost.dto';

// The same options main.ts gives the global pipe
const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  transformOptions: { enableImplicitConversion: true },
});

const run = (metatype: new () => object, query: unknown) =>
  pipe.transform(query, { type: 'query', metatype });

const rejected = async (
  metatype: new () => object,
  query: unknown,
): Promise<string> => {
  try {
    await run(metatype, query);
  } catch (error) {
    const response = (
      error as { getResponse: () => { message: string[]; statusCode: number } }
    ).getResponse();
    expect(response.statusCode).toBe(400);
    return response.message.join(' ');
  }
  throw new Error('expected the query to be rejected');
};

describe('NearbyStopsQueryDto', () => {
  const ok = { lat: '5.6037', lng: '-0.187' };

  it('accepts coordinates and defaults the radius to 1000', async () => {
    await expect(run(NearbyStopsQueryDto, ok)).resolves.toMatchObject({
      lat: 5.6037,
      lng: -0.187,
      radius: 1000,
    });
  });

  it('accepts a radius and a stop type', async () => {
    await expect(
      run(NearbyStopsQueryDto, { ...ok, radius: '250', type: 'bus_stop' }),
    ).resolves.toMatchObject({ radius: 250, type: 'bus_stop' });
  });

  it.each(['95', '-91', 'abc', '', ' '])('rejects lat=%p', async (lat) => {
    await expect(
      rejected(NearbyStopsQueryDto, { ...ok, lat }),
    ).resolves.toMatch(/lat/);
  });

  it.each(['181', '-190', 'abc', ''])('rejects lng=%p', async (lng) => {
    await expect(
      rejected(NearbyStopsQueryDto, { ...ok, lng }),
    ).resolves.toMatch(/lng/);
  });

  it.each(['-5', '0', 'abc', '', 'Infinity'])(
    'rejects radius=%p',
    async (radius) => {
      await expect(
        rejected(NearbyStopsQueryDto, { ...ok, radius }),
      ).resolves.toMatch(/radius/);
    },
  );
});

describe('RouteCalculationQueryDto', () => {
  const ok = {
    start_lat: '5.6037',
    start_lng: '-0.187',
    end_lat: '6.6885',
    end_lng: '-1.6244',
  };

  it('accepts coordinates and defaults the mode to driving', async () => {
    await expect(run(RouteCalculationQueryDto, ok)).resolves.toMatchObject({
      start_lat: 5.6037,
      end_lng: -1.6244,
      mode: 'driving',
    });
  });

  it.each(['driving', 'walking', 'cycling', 'publicTransport'])(
    'accepts mode=%p',
    async (mode) => {
      await expect(
        run(RouteCalculationQueryDto, { ...ok, mode }),
      ).resolves.toMatchObject({ mode });
    },
  );

  it.each(['teleport', 'DRIVING', ''])('rejects mode=%p', async (mode) => {
    await expect(
      rejected(RouteCalculationQueryDto, { ...ok, mode }),
    ).resolves.toMatch(/mode/);
  });

  it.each(['start_lat', 'end_lat'])('rejects %s=95', async (key) => {
    await expect(
      rejected(RouteCalculationQueryDto, { ...ok, [key]: '95' }),
    ).resolves.toMatch(new RegExp(key));
  });

  it.each(['start_lng', 'end_lng'])('rejects %s=-190', async (key) => {
    await expect(
      rejected(RouteCalculationQueryDto, { ...ok, [key]: '-190' }),
    ).resolves.toMatch(new RegExp(key));
  });

  it('rejects a missing coordinate', async () => {
    await expect(
      rejected(RouteCalculationQueryDto, { ...ok, end_lat: undefined }),
    ).resolves.toMatch(/end_lat/);
  });
});

describe('TravelCostQueryDto', () => {
  it('defaults the mode to car and the fuel efficiency to 12', async () => {
    await expect(
      run(TravelCostQueryDto, { distance: '10' }),
    ).resolves.toMatchObject({
      distance: 10,
      mode: 'car',
      fuel_efficiency: 12,
    });
  });

  it('accepts a distance of 0 and a mode in any case', async () => {
    await expect(
      run(TravelCostQueryDto, { distance: '0', mode: 'Trotro' }),
    ).resolves.toMatchObject({ distance: 0, mode: 'trotro' });
  });

  it.each(['-10', '-0.5', 'abc', '', ' ', 'Infinity'])(
    'rejects distance=%p',
    async (distance) => {
      await expect(rejected(TravelCostQueryDto, { distance })).resolves.toMatch(
        /distance/,
      );
    },
  );

  it.each(['boat', 'plane', ''])('rejects mode=%p', async (mode) => {
    await expect(
      rejected(TravelCostQueryDto, { distance: '10', mode }),
    ).resolves.toMatch(/mode/);
  });

  it.each(['0', '-3', 'abc', ''])(
    'rejects fuel_efficiency=%p',
    async (fuel_efficiency) => {
      await expect(
        rejected(TravelCostQueryDto, { distance: '10', fuel_efficiency }),
      ).resolves.toMatch(/fuel_efficiency/);
    },
  );
});
