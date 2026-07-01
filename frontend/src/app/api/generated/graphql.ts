/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { gql } from 'apollo-angular';
import { Injectable } from '@angular/core';
import * as Apollo from 'apollo-angular';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: Date; output: Date; }
  Decimal: { input: number; output: number; }
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  /** JWT token for authentication */
  token: Scalars['String']['output'];
  /** User that authenticated */
  user: AuthUser;
};

export type AuthUser = {
  __typename?: 'AuthUser';
  /** User email address */
  email: Scalars['String']['output'];
  /** User unique identifier */
  id: Scalars['ID']['output'];
};

export type Build = {
  __typename?: 'Build';
  /** Timestamp when build was created */
  createdAt: Scalars['DateTime']['output'];
  /** Optional description */
  description?: Maybe<Scalars['String']['output']>;
  /** Build unique identifier */
  id: Scalars['ID']['output'];
  /** Build name/identifier */
  name: Scalars['String']['output'];
  /** Parts included in this build (batched via DataLoader to prevent N+1) */
  parts: Array<Part>;
  /** Current build status */
  status: BuildStatus;
  /** Test runs for this build (batched via DataLoader to prevent N+1) */
  testRuns: Array<TestRun>;
  /** Timestamp of last update */
  updatedAt: Scalars['DateTime']['output'];
};

export enum BuildStatus {
  Complete = 'COMPLETE',
  Failed = 'FAILED',
  Pending = 'PENDING',
  Running = 'RUNNING'
}

/** Build status update from subscription */
export type BuildStatusUpdate = {
  __typename?: 'BuildStatusUpdate';
  /** Build ID being updated */
  buildId: Scalars['ID']['output'];
  /** New build status */
  newStatus: BuildStatus;
  /** Previous build status */
  oldStatus: BuildStatus;
  /** Timestamp of update */
  timestamp: Scalars['DateTime']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Add a part to a build */
  addPart: Part;
  /** Create a new build */
  createBuild: Build;
  /** Authenticate user with email and password */
  login: AuthPayload;
  /** Submit a test run for a build */
  submitTestRun: TestRun;
  /** Update build status and emit buildStatusUpdated subscription event */
  updateBuildStatus: Build;
};


export type MutationAddPartArgs = {
  buildId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  quantity: Scalars['Decimal']['input'];
  sku: Scalars['String']['input'];
};


export type MutationCreateBuildArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationSubmitTestRunArgs = {
  buildId: Scalars['ID']['input'];
  fileUrl?: InputMaybe<Scalars['String']['input']>;
  result?: InputMaybe<Scalars['String']['input']>;
  status: TestStatus;
};


export type MutationUpdateBuildStatusArgs = {
  id: Scalars['ID']['input'];
  status: BuildStatus;
};

export type PaginatedBuilds = {
  __typename?: 'PaginatedBuilds';
  /** Whether there is a next page */
  hasNextPage: Scalars['Boolean']['output'];
  /** Whether there is a previous page */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** Array of builds for the current page */
  items: Array<Build>;
  /** Total number of builds */
  totalCount: Scalars['Int']['output'];
};

export type Part = {
  __typename?: 'Part';
  /** Build this part belongs to */
  buildId: Scalars['ID']['output'];
  /** Timestamp when part was created */
  createdAt: Scalars['DateTime']['output'];
  /** Part unique identifier */
  id: Scalars['ID']['output'];
  /** Part name */
  name: Scalars['String']['output'];
  /** Quantity in build */
  quantity: Scalars['Decimal']['output'];
  /** Stock keeping unit */
  sku: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  /** Fetch a build by ID */
  build?: Maybe<Build>;
  /** Fetch paginated builds */
  builds: PaginatedBuilds;
};


export type QueryBuildArgs = {
  id: Scalars['ID']['input'];
};


export type QueryBuildsArgs = {
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
};

export type Subscription = {
  __typename?: 'Subscription';
  /** Subscribe to real-time build status updates for a specific build */
  buildStatusUpdated: BuildStatusUpdate;
  /** Subscribe to test run completion events for a specific build */
  testRunCompleted: TestRunUpdate;
};


export type SubscriptionBuildStatusUpdatedArgs = {
  buildId: Scalars['ID']['input'];
};


export type SubscriptionTestRunCompletedArgs = {
  buildId: Scalars['ID']['input'];
};

export type TestRun = {
  __typename?: 'TestRun';
  /** Build this test run belongs to */
  buildId: Scalars['ID']['output'];
  /** Timestamp when test completed */
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Timestamp when test was created */
  createdAt: Scalars['DateTime']['output'];
  /** URL to test result file */
  fileUrl?: Maybe<Scalars['String']['output']>;
  /** TestRun unique identifier */
  id: Scalars['ID']['output'];
  /** Test result summary */
  result?: Maybe<Scalars['String']['output']>;
  /** Current test status */
  status: TestStatus;
  /** Timestamp of last update */
  updatedAt: Scalars['DateTime']['output'];
};

/** Test run completion update from subscription */
export type TestRunUpdate = {
  __typename?: 'TestRunUpdate';
  /** Build ID */
  buildId: Scalars['ID']['output'];
  /** Test status */
  status: TestStatus;
  /** Test run ID */
  testRunId: Scalars['ID']['output'];
  /** Timestamp of update */
  timestamp: Scalars['DateTime']['output'];
};

export enum TestStatus {
  Failed = 'FAILED',
  Passed = 'PASSED',
  Pending = 'PENDING',
  Running = 'RUNNING'
}

export type GetBuildQueryVariables = Exact<{
  id: string | number;
}>;


export type GetBuildQuery = { build: { id: string, name: string, description: string | null, status: BuildStatus, createdAt: Date, updatedAt: Date, parts: Array<{ id: string, name: string, sku: string, quantity: number }>, testRuns: Array<{ id: string, status: TestStatus, result: string | null, fileUrl: string | null }> } | null };

export type ListBuildsQueryVariables = Exact<{
  limit: number;
  offset: number;
}>;


export type ListBuildsQuery = { builds: { totalCount: number, hasNextPage: boolean, hasPreviousPage: boolean, items: Array<{ id: string, name: string, status: BuildStatus, createdAt: Date }> } };

export type CreateBuildMutationVariables = Exact<{
  name: string;
  description?: string | null | undefined;
}>;


export type CreateBuildMutation = { createBuild: { id: string, name: string, status: BuildStatus } };

export type UpdateBuildStatusMutationVariables = Exact<{
  id: string | number;
  status: BuildStatus;
}>;


export type UpdateBuildStatusMutation = { updateBuildStatus: { id: string, status: BuildStatus, updatedAt: Date } };

export type AddPartMutationVariables = Exact<{
  buildId: string | number;
  name: string;
  sku: string;
  quantity: number;
}>;


export type AddPartMutation = { addPart: { id: string, buildId: string, name: string, sku: string, quantity: number } };

export type SubmitTestRunMutationVariables = Exact<{
  buildId: string | number;
  status: TestStatus;
  result?: string | null | undefined;
  fileUrl?: string | null | undefined;
}>;


export type SubmitTestRunMutation = { submitTestRun: { id: string, status: TestStatus, result: string | null, completedAt: Date | null } };

export type BuildStatusUpdatedSubscriptionVariables = Exact<{
  buildId: string | number;
}>;


export type BuildStatusUpdatedSubscription = { buildStatusUpdated: { buildId: string, oldStatus: BuildStatus, newStatus: BuildStatus, timestamp: Date } };

export type TestRunCompletedSubscriptionVariables = Exact<{
  buildId: string | number;
}>;


export type TestRunCompletedSubscription = { testRunCompleted: { testRunId: string, buildId: string, status: TestStatus, timestamp: Date } };

export const GetBuildDocument = gql`
    query GetBuild($id: ID!) {
  build(id: $id) {
    id
    name
    description
    status
    createdAt
    updatedAt
    parts {
      id
      name
      sku
      quantity
    }
    testRuns {
      id
      status
      result
      fileUrl
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class GetBuildGQL extends Apollo.Query<GetBuildQuery, GetBuildQueryVariables> {
    document = GetBuildDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const ListBuildsDocument = gql`
    query ListBuilds($limit: Int!, $offset: Int!) {
  builds(limit: $limit, offset: $offset) {
    items {
      id
      name
      status
      createdAt
    }
    totalCount
    hasNextPage
    hasPreviousPage
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class ListBuildsGQL extends Apollo.Query<ListBuildsQuery, ListBuildsQueryVariables> {
    document = ListBuildsDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const CreateBuildDocument = gql`
    mutation CreateBuild($name: String!, $description: String) {
  createBuild(name: $name, description: $description) {
    id
    name
    status
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class CreateBuildGQL extends Apollo.Mutation<CreateBuildMutation, CreateBuildMutationVariables> {
    document = CreateBuildDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const UpdateBuildStatusDocument = gql`
    mutation UpdateBuildStatus($id: ID!, $status: BuildStatus!) {
  updateBuildStatus(id: $id, status: $status) {
    id
    status
    updatedAt
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class UpdateBuildStatusGQL extends Apollo.Mutation<UpdateBuildStatusMutation, UpdateBuildStatusMutationVariables> {
    document = UpdateBuildStatusDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const AddPartDocument = gql`
    mutation AddPart($buildId: ID!, $name: String!, $sku: String!, $quantity: Decimal!) {
  addPart(buildId: $buildId, name: $name, sku: $sku, quantity: $quantity) {
    id
    buildId
    name
    sku
    quantity
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class AddPartGQL extends Apollo.Mutation<AddPartMutation, AddPartMutationVariables> {
    document = AddPartDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const SubmitTestRunDocument = gql`
    mutation SubmitTestRun($buildId: ID!, $status: TestStatus!, $result: String, $fileUrl: String) {
  submitTestRun(
    buildId: $buildId
    status: $status
    result: $result
    fileUrl: $fileUrl
  ) {
    id
    status
    result
    completedAt
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class SubmitTestRunGQL extends Apollo.Mutation<SubmitTestRunMutation, SubmitTestRunMutationVariables> {
    document = SubmitTestRunDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const BuildStatusUpdatedDocument = gql`
    subscription BuildStatusUpdated($buildId: ID!) {
  buildStatusUpdated(buildId: $buildId) {
    buildId
    oldStatus
    newStatus
    timestamp
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class BuildStatusUpdatedGQL extends Apollo.Subscription<BuildStatusUpdatedSubscription, BuildStatusUpdatedSubscriptionVariables> {
    document = BuildStatusUpdatedDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const TestRunCompletedDocument = gql`
    subscription TestRunCompleted($buildId: ID!) {
  testRunCompleted(buildId: $buildId) {
    testRunId
    buildId
    status
    timestamp
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class TestRunCompletedGQL extends Apollo.Subscription<TestRunCompletedSubscription, TestRunCompletedSubscriptionVariables> {
    document = TestRunCompletedDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }