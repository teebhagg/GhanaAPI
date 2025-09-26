// Jest setup for Node.js test environment compatibility with Cheerio/Undici

// Import necessary polyfills
import 'whatwg-fetch';

// Mock Web APIs that cheerio/undici expects but aren't available in Node.js
Object.assign(global, {
  // Mock File constructor
  File: class MockFile {
    name: string;
    size: number;
    type: string;
    lastModified: number;

    constructor(
      fileBits: BlobPart[],
      fileName: string,
      options?: FilePropertyBag,
    ) {
      this.name = fileName;
      this.size = 0;
      this.type = options?.type || '';
      this.lastModified = options?.lastModified || Date.now();
    }

    stream() {
      return new ReadableStream();
    }

    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(0));
    }

    text() {
      return Promise.resolve('');
    }

    slice() {
      return new MockFile([], this.name);
    }
  },

  // Mock FormData
  FormData: class MockFormData {
    private data = new Map<string, any>();

    append(name: string, value: any) {
      const existing = this.data.get(name);
      if (existing) {
        this.data.set(
          name,
          Array.isArray(existing) ? [...existing, value] : [existing, value],
        );
      } else {
        this.data.set(name, value);
      }
    }

    delete(name: string) {
      this.data.delete(name);
    }

    get(name: string) {
      const value = this.data.get(name);
      return Array.isArray(value) ? value[0] : value;
    }

    getAll(name: string) {
      const value = this.data.get(name);
      return value ? (Array.isArray(value) ? value : [value]) : [];
    }

    has(name: string) {
      return this.data.has(name);
    }

    set(name: string, value: any) {
      this.data.set(name, value);
    }

    forEach(callback: (value: any, name: string) => void) {
      this.data.forEach((value, name) => {
        if (Array.isArray(value)) {
          value.forEach((v) => callback(v, name));
        } else {
          callback(value, name);
        }
      });
    }

    *entries() {
      for (const [name, value] of this.data) {
        if (Array.isArray(value)) {
          for (const v of value) {
            yield [name, v];
          }
        } else {
          yield [name, value];
        }
      }
    }

    *keys() {
      for (const [name] of this.entries()) {
        yield name;
      }
    }

    *values() {
      for (const [, value] of this.entries()) {
        yield value;
      }
    }

    [Symbol.iterator]() {
      return this.entries();
    }
  },
});

// Mock Cheerio module to prevent import-time issues - DISABLED FOR NOW
/*
jest.mock('cheerio', () => {
  // Create a comprehensive mock for cheerio elements
  const createMockElement = (mockData?: any) => {
    const element = {
      find: jest.fn().mockImplementation((selector: string) => {
        // Handle NPA selectors
        if (selector.includes('.entry-title a') || selector.includes('.post-title a') || selector.includes('h3 a') || selector.includes('h2 a')) {
          return {
            slice: jest.fn().mockReturnValue([{
              eq: jest.fn().mockImplementation((index: number) => ({
                text: jest.fn().mockReturnValue('Latest Fuel Price Announcement'),
                attr: jest.fn().mockImplementation((attrName: string) => {
                  if (attrName === 'href') return '/press-release-fuel-prices';
                  return '';
                }),
              })),
              length: 1,
            }]),
            length: 1,
          };
        }
        
        // Handle NPA article content
        if (selector.includes('.entry-content') || selector.includes('.post-content') || selector.includes('.content') || selector.includes('.article-content')) {
          return {
            text: jest.fn().mockReturnValue(
              'The National Petroleum Authority announces the following indicative prices: Petrol: GH¢ 13.50 per litre Diesel: GH¢ 14.20 per litre LPG: GH¢ 13.80 per kilogram'
            ),
          };
        }
        
        // Mock specific selectors for fuel price parsing
        if (selector.includes('td') || selector.includes('.price')) {
          return createMockElement({ text: '12.50' });
        }
        if (selector.includes('tr')) {
          // Return array-like structure for fuel price table rows
          const rows = [
            createMockElement({ text: 'Shell 12.89 13.89 14.99' }),
            createMockElement({ text: 'Goil 12.99 13.90 14.90' }),
            createMockElement({ text: 'Total 12.88 14.30 16.67' }),
            createMockElement({ text: 'StarOil 12.77 13.45 14.68' }),
          ];
          rows.length = 4;
          (rows as any).each = jest.fn().mockImplementation((callback) => {
            rows.forEach((row, index) => callback.call(row, index, row));
            return rows;
          });
          return rows;
        }
        if (selector.includes('table')) {
          return createMockElement({ length: 1 });
        }
        return createMockElement();
      }),
      text: jest.fn().mockImplementation(() => {
        if (mockData?.text) return mockData.text;
        return '';
      }),
      attr: jest.fn().mockReturnValue(''),
      html: jest.fn().mockReturnValue(''),
      val: jest.fn().mockReturnValue(''),
      each: jest.fn().mockImplementation(function (
        this: any,
        callback: Function,
      ) {
        // Mock each iteration for table rows/cells
        if (typeof callback === 'function') {
          // Mock fuel price data from CediRates table structure
          const fuelData = [
            { text: () => 'Shell', cells: [() => '', () => 'Shell Get', () => '12.89', () => '13.89', () => '14.99'] },
            { text: () => 'Goil', cells: [() => '', () => 'Goil Get', () => '12.99', () => '13.90', () => '14.90'] },
            { text: () => 'Total', cells: [() => '', () => 'TotalEnergies Get', () => '12.88', () => '14.30', () => '16.67'] },
            { text: () => 'StarOil', cells: [() => '', () => 'StarOil Get', () => '12.77', () => '13.45', () => '14.68'] },
          ];
          
          fuelData.forEach((item, index) => {
            const mockRow = {
              ...createMockElement({ text: item.text() }),
              find: jest.fn().mockImplementation((sel: string) => {
                if (sel.includes('td')) {
                  // Return mock table cells with fuel price data
                  const cells = item.cells.map((cellData, cellIndex) => ({
                    ...createMockElement({ text: cellData() }),
                    eq: jest.fn().mockImplementation((i) => createMockElement({ text: cellData() })),
                  }));
                  cells.length = item.cells.length;
                  (cells as any).eq = jest.fn().mockImplementation((i) => createMockElement({ text: item.cells[i]() }));
                  return cells;
                }
                return createMockElement();
              }),
            };
            callback.call(mockRow, index, mockRow);
          });
        }
        return this;
      }),
      eq: jest.fn().mockReturnThis(),
      first: jest.fn().mockReturnThis(),
      last: jest.fn().mockReturnThis(),
      parent: jest.fn().mockReturnThis(),
      children: jest.fn().mockImplementation(() => {
        // Return mock table cells/rows for fuel price parsing
        return [
          createMockElement({ text: 'Shell' }),
          createMockElement({ text: '12.89' }),
        ];
      }),
      siblings: jest.fn().mockReturnThis(),
      next: jest.fn().mockReturnThis(),
      prev: jest.fn().mockReturnThis(),
      addClass: jest.fn().mockReturnThis(),
      removeClass: jest.fn().mockReturnThis(),
      hasClass: jest.fn().mockReturnValue(false),
      css: jest.fn().mockReturnThis(),
      data: jest.fn().mockReturnValue(''),
      removeAttr: jest.fn().mockReturnThis(),
      prop: jest.fn().mockReturnValue(''),
      is: jest.fn().mockReturnValue(false),
      not: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      map: jest.fn().mockReturnThis(),
      get: jest.fn().mockReturnValue([]),
      toArray: jest.fn().mockReturnValue([]),
      length: mockData?.length || 4, // Default length for table rows
    };

    // Add array-like behavior
    element[0] = element;
    element[1] = element;
    element[2] = element;
    element[3] = element;

    return element;
  };

  const mockCheerio = {
    load: jest.fn().mockImplementation((html: string) => {
      // Create the root cheerio function
      const cheerioRoot = jest.fn().mockImplementation((selector?: any) => {
        if (!selector) return createMockElement();

        // Convert selector to string for safety
        const selectorStr = String(selector);

        // Return specific mocks for fuel price selectors
        if (selectorStr.includes('table') || selectorStr.includes('tbody')) {
          return createMockElement({ length: 1 });
        }

        if (selectorStr.includes('tr')) {
          return createMockElement({ length: 4 });
        }

        if (selectorStr.includes('td')) {
          // Mock fuel price data extraction
          return createMockElement({ text: '12.50' });
        }

        return createMockElement();
      });

      // Add cheerio methods to the root function without overriding length
      const methods = createMockElement();
      Object.keys(methods).forEach((key) => {
        if (key !== 'length') {
          cheerioRoot[key] = methods[key];
        }
      });

      return cheerioRoot;
    }),

    // Export other cheerio utilities
    html: jest.fn().mockReturnValue('<html></html>'),
    text: jest.fn().mockReturnValue(''),
    root: jest.fn(),
    contains: jest.fn().mockReturnValue(false),
    merge: jest.fn().mockReturnValue([]),
    parseHTML: jest.fn().mockReturnValue([]),
    isArray: jest.fn().mockReturnValue(false),
    makeArray: jest.fn().mockReturnValue([]),
    inArray: jest.fn().mockReturnValue(-1),
    grep: jest.fn().mockReturnValue([]),
    map: jest.fn().mockReturnValue([]),
  };

  return {
    ...mockCheerio,
    default: mockCheerio,
    load: mockCheerio.load,
  };
});
*/

// Mock axios and @nestjs/axios to prevent HTTP requests during tests
import { of } from 'rxjs';

jest.mock('axios', () => ({
  default: {
    get: jest
      .fn()
      .mockResolvedValue({ data: '<html><body>Mock HTML</body></html>', status: 200 }),
    post: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
    put: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
    delete: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
    create: jest.fn().mockReturnThis(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
  get: jest
    .fn()
    .mockResolvedValue({ data: '<html><body>Mock HTML</body></html>', status: 200 }),
  post: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
  put: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
  delete: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
  create: jest.fn().mockReturnThis(),
}));

// Mock @nestjs/axios completely with proper module structure
jest.mock('@nestjs/axios', () => {
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
      
      // Mock CediRates fuel prices page
      if (url && url.includes('cedirates.com/fuel-prices')) {
        mockData = `
          <html>
            <body>
              <table>
                <tr><td>Shell</td><td>12.89</td><td>13.89</td><td>14.99</td></tr>
                <tr><td>Goil</td><td>12.99</td><td>13.90</td><td>14.90</td></tr>
                <tr><td>Total</td><td>12.88</td><td>14.30</td><td>16.67</td></tr>
                <tr><td>StarOil</td><td>12.77</td><td>13.45</td><td>14.68</td></tr>
              </table>
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
    put() {
      return of({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });
    }
    delete() {
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
    
    static forRoot() {
      return MockHttpModule.register();
    }
  }
  
  return {
    HttpService: MockHttpService,
    HttpModule: MockHttpModule,
  };
});
