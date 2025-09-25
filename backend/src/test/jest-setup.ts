// Jest global setup - runs before all tests
// This file ensures mocks are established before any imports happen

// Simple cheerio mock that prevents import issues
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

// Mock axios
jest.doMock('axios', () => ({
  default: {
    get: jest.fn().mockResolvedValue({ 
      data: '<html><body>Mock HTML</body></html>',
      status: 200,
    }),
    post: jest.fn().mockResolvedValue({ data: {} }),
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
  post: jest.fn().mockResolvedValue({ data: {} }),
}));
