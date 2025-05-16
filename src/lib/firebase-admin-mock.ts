// This is a mock implementation of the Firebase admin SDK for build time
// It provides dummy implementations of the methods used in the application

export const auth = {
  verifyIdToken: async () => ({
    uid: 'mock-uid',
    email: 'mock@example.com',
  }),
  getUser: async () => ({
    uid: 'mock-uid',
    email: 'mock@example.com',
    displayName: 'Mock User',
  }),
};

export const db = {
  collection: (collectionName: string) => ({
    doc: (docId: string) => ({
      get: async () => ({
        exists: true,
        id: docId,
        data: () => ({
          name: 'Mock Document',
          slug: 'mock-slug',
          createdAt: new Date().toISOString(),
        }),
      }),
      set: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
    }),
    where: () => ({
      get: async () => ({
        empty: true,
        docs: [],
      }),
      where: () => ({
        get: async () => ({
          empty: true,
          docs: [],
        }),
      }),
    }),
    add: async () => ({ id: 'mock-id' }),
    get: async () => ({
      empty: true,
      docs: [],
    }),
  }),
};
