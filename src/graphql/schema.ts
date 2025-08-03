export const graphqlSchema = `
  type ScanJob {
    id: ID!
    jenkinsJobId: String
    scanType: String!
    status: String!
    parameters: String!
    reportUrl: String
    summary: String
    metadata: String
    createdAt: String!
    updatedAt: String!
    completedAt: String
  }

  type ScanJobResult {
    id: ID!
    scanType: String!
    status: String!
    jenkinsJobId: String
    reportUrl: String
    summary: String
    metadata: String
    log: String
    createdAt: String!
    updatedAt: String!
    completedAt: String
  }

  type Query {
    scanJob(id: ID!): ScanJobResult
    scanJobs(limit: Int = 10, offset: Int = 0): [ScanJob!]!
  }

  type Mutation {
    triggerScan(scanType: String!, parameters: String!, metadata: String): ScanJob!
  }
`; 