// Jest global setup - runs before all tests
// This file ensures mocks are established before any imports happen

// Import rxjs for mocking
import { of } from 'rxjs';

// Simple cheerio mock that prevents import issues - DISABLED FOR NOW
/*
jest.doMock('cheerio', () => {
  const mockElement = () => ({
    find: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnValue(''),
    attr: jest.fn().mockReturnValue(''),
    html: jest.fn().mockReturnValue(''),
    each: jest.fn().mockReturnThis(),
    length: 0,
  });

  return {
    load: jest.fn(() => mockElement()),
    default: {
      load: jest.fn(() => mockElement()),
    },
  };
});
*/

// Mock axios
jest.doMock('axios', () => ({
  default: {
    get: jest.fn().mockResolvedValue({
      data: '<html><body>Mock HTML</body></html>',
      status: 200,
    }),
    post: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
    create: jest.fn().mockReturnThis(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
  get: jest.fn().mockResolvedValue({
    data: '<html><body>Mock HTML</body></html>',
    status: 200,
  }),
  post: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
}));

// Mock @nestjs/axios completely
jest.doMock('@nestjs/axios', () => {
  const { of } = require('rxjs');
  
  class MockHttpService {
    get(url?: string) {
      let mockData = '<html><body>Mock HTML</body></html>';
      
      // Mock NPA press releases page
      if (url && url.includes('npa.gov.gh/category/press-releases')) {
        mockData = `
          <html>
            <body>
              <div class="entry-title">
                <a href="/press-release-fuel-prices">Latest Fuel Price Announcement</a>
              </div>
            </body>
          </html>
        `;
      }
      
      // Mock NPA article page
      if (url && url.includes('/press-release-fuel-prices')) {
        mockData = `
          <html>
            <body>
              <div class="entry-content">
                The National Petroleum Authority announces the following indicative prices: Petrol: GH¢ 13.50 per litre Diesel: GH¢ 14.20 per litre LPG: GH¢ 13.80 per kilogram
              </div>
            </body>
          </html>
        `;
      }
      
      return of({
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });
    }
    post() {
      return of({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });
    }
  }
  
  class MockHttpModule {
    static register() {
      return {
        module: MockHttpModule,
        providers: [
          {
            provide: MockHttpService,
            useClass: MockHttpService,
          },
        ],
        exports: [MockHttpService],
        global: false,
      };
    }
  }
  
  return {
    HttpService: MockHttpService,
    HttpModule: MockHttpModule,
  };
});
