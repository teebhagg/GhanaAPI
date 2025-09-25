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

// Mock Cheerio module to prevent import-time issues
jest.mock('cheerio', () => {
  // Create a comprehensive mock for cheerio elements
  const createMockElement = (mockData?: any) => {
    const element = {
      find: jest.fn().mockImplementation((selector: string) => {
        // Mock specific selectors for fuel price parsing
        if (selector.includes('td') || selector.includes('.price')) {
          return createMockElement({ text: '12.50' });
        }
        if (selector.includes('tr')) {
          return [
            createMockElement({ text: 'Shell 12.90' }),
            createMockElement({ text: 'Goil 12.80' }),
            createMockElement({ text: 'Total 12.95' }),
          ];
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
      each: jest.fn().mockImplementation(function(this: any, callback: Function) {
        // Mock each iteration for table rows/cells
        if (typeof callback === 'function') {
          ['Shell 12.90', 'Goil 12.80', 'Total 12.95'].forEach((item, index) => {
            const mockRow = createMockElement({ text: item });
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
          createMockElement({ text: '12.90' }),
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
      length: mockData?.length || 3, // Default length for table rows
    };

    // Add array-like behavior
    element[0] = element;
    element[1] = element;
    element[2] = element;

    return element;
  };

  const mockCheerio = {
    load: jest.fn().mockImplementation((html: string) => {
      // Create the root cheerio function
      const cheerioRoot = jest.fn().mockImplementation((selector?: string) => {
        if (!selector) return createMockElement();
        
        // Return specific mocks for fuel price selectors
        if (selector.includes('table') || selector.includes('tbody')) {
          return createMockElement({ length: 1 });
        }
        
        if (selector.includes('tr')) {
          return createMockElement({ length: 3 });
        }
        
        if (selector.includes('td')) {
          // Mock fuel price data extraction
          return createMockElement({ text: '12.50' });
        }
        
        return createMockElement();
      });

      // Add cheerio methods to the root function without overriding length
      const methods = createMockElement();
      Object.keys(methods).forEach(key => {
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

// Mock axios to prevent HTTP requests during tests
jest.mock('axios', () => ({
  default: {
    get: jest.fn().mockResolvedValue({ data: '<html><body>Mock HTML</body></html>' }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    create: jest.fn().mockReturnThis(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
  get: jest.fn().mockResolvedValue({ data: '<html><body>Mock HTML</body></html>' }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  put: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} }),
  create: jest.fn().mockReturnThis(),
}));
