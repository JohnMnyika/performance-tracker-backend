const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// GraphQL schema and resolvers.
const typeDefs = gql`
  type Record {
    id: ID!
    date: String!
    shift: String!
    count: Int!
    userId: String!
  }

  type Query {
    getRecords(userId: String!): [Record]
  }

  type Mutation {
    addRecord(date: String!, shift: String!, count: Int!, userId: String!): Record
  }
`;

const resolvers = {
  Query: {
    getRecords: async (_, { userId }) => {
      const snapshot = await db.collection('records').where('userId', '==', userId).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  },
  Mutation: {
    addRecord: async (_, { date, shift, count, userId }) => {
      const newRecord = { date, shift, count, userId };
      const docRef = await db.collection('records').add(newRecord);
      return { id: docRef.id, ...newRecord };
    }
  }
};

async function startServer() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  const app = express();
  server.applyMiddleware({ app });

  app.listen({ port: 4000 }, () =>
    console.log(`Server ready at http://localhost:4000${server.graphqlPath}`)
  );
}

startServer().catch(error => {
  console.error('Failed to start server', error);
});
