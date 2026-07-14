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
  Long: { input: number; output: number; }
};

export type BuildStatus =
  | 'COMPLETE'
  | 'FAILED'
  | 'PENDING'
  | 'RUNNING';

export type TestStatus =
  | 'FAILED'
  | 'PASSED'
  | 'PENDING'
  | 'RUNNING';

export type BuildStatus =
  | 'COMPLETE'
  | 'FAILED'
  | 'PENDING'
  | 'RUNNING';

export type TestStatus =
  | 'FAILED'
  | 'PASSED'
  | 'PENDING'
  | 'RUNNING';

export type GetWorkflowQueryVariables = Exact<{
  id: string | number;
}>;


export type GetWorkflowQuery = { workflow: { id: string, buildId: string | null, status: string, startedAt: Date, completedAt: Date | null, activities: Array<{ name: string, status: string, startTime: Date | null, endTime: Date | null, durationMs: number | null, errorMessage: string | null }>, history: Array<{ id: string, workflowInstanceId: string, buildId: string | null, eventType: string, activityName: string, oldStatus: string, newStatus: string, stateSnapshot: string | null, errorMessage: string | null, recordedAt: Date, executionStarted: Date | null, executionCompleted: Date | null, elapsedMilliseconds: number | null }> } | null };

export type GetWorkflowsByBuildQueryVariables = Exact<{
  buildId: string | number;
}>;


export type GetWorkflowsByBuildQuery = { workflowsByBuild: Array<{ id: string, buildId: string | null, status: string, startedAt: Date, completedAt: Date | null, activities: Array<{ name: string, status: string, durationMs: number | null }>, history: Array<{ id: string, eventType: string, recordedAt: Date }> }> };

export type GetWorkflowHistoryQueryVariables = Exact<{
  workflowId: string | number;
  limit?: number | null | undefined;
}>;


export type GetWorkflowHistoryQuery = { workflowHistory: Array<{ id: string, workflowInstanceId: string, buildId: string | null, eventType: string, activityName: string, oldStatus: string, newStatus: string, stateSnapshot: string | null, errorMessage: string | null, recordedAt: Date, executionStarted: Date | null, executionCompleted: Date | null, elapsedMilliseconds: number | null }> };

export type WorkflowUpdatedSubscriptionVariables = Exact<{
  workflowId: string | number;
}>;


export type WorkflowUpdatedSubscription = { workflowUpdated: { id: string, buildId: string | null, status: string, startedAt: Date, completedAt: Date | null, activities: Array<{ name: string, status: string, startTime: Date | null, endTime: Date | null, durationMs: number | null, errorMessage: string | null }> } };

export type WorkflowHistoryAddedSubscriptionVariables = Exact<{
  workflowId: string | number;
}>;


export type WorkflowHistoryAddedSubscription = { workflowHistoryAdded: { id: string, workflowInstanceId: string, buildId: string | null, eventType: string, activityName: string, oldStatus: string, newStatus: string, stateSnapshot: string | null, errorMessage: string | null, recordedAt: Date, executionStarted: Date | null, executionCompleted: Date | null, elapsedMilliseconds: number | null } };

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

export const GetWorkflowDocument = gql`
    query GetWorkflow($id: ID!) {
  workflow(id: $id) {
    id
    buildId
    status
    startedAt
    completedAt
    activities {
      name
      status
      startTime
      endTime
      durationMs
      errorMessage
    }
    history {
      id
      workflowInstanceId
      buildId
      eventType
      activityName
      oldStatus
      newStatus
      stateSnapshot
      errorMessage
      recordedAt
      executionStarted
      executionCompleted
      elapsedMilliseconds
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class GetWorkflowGQL extends Apollo.Query<GetWorkflowQuery, GetWorkflowQueryVariables> {
    document = GetWorkflowDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const GetWorkflowsByBuildDocument = gql`
    query GetWorkflowsByBuild($buildId: ID!) {
  workflowsByBuild(buildId: $buildId) {
    id
    buildId
    status
    startedAt
    completedAt
    activities {
      name
      status
      durationMs
    }
    history {
      id
      eventType
      recordedAt
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class GetWorkflowsByBuildGQL extends Apollo.Query<GetWorkflowsByBuildQuery, GetWorkflowsByBuildQueryVariables> {
    document = GetWorkflowsByBuildDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const GetWorkflowHistoryDocument = gql`
    query GetWorkflowHistory($workflowId: ID!, $limit: Int = 100) {
  workflowHistory(workflowId: $workflowId, limit: $limit) {
    id
    workflowInstanceId
    buildId
    eventType
    activityName
    oldStatus
    newStatus
    stateSnapshot
    errorMessage
    recordedAt
    executionStarted
    executionCompleted
    elapsedMilliseconds
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class GetWorkflowHistoryGQL extends Apollo.Query<GetWorkflowHistoryQuery, GetWorkflowHistoryQueryVariables> {
    document = GetWorkflowHistoryDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const WorkflowUpdatedDocument = gql`
    subscription WorkflowUpdated($workflowId: ID!) {
  workflowUpdated(workflowId: $workflowId) {
    id
    buildId
    status
    startedAt
    completedAt
    activities {
      name
      status
      startTime
      endTime
      durationMs
      errorMessage
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class WorkflowUpdatedGQL extends Apollo.Subscription<WorkflowUpdatedSubscription, WorkflowUpdatedSubscriptionVariables> {
    document = WorkflowUpdatedDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const WorkflowHistoryAddedDocument = gql`
    subscription WorkflowHistoryAdded($workflowId: ID!) {
  workflowHistoryAdded(workflowId: $workflowId) {
    id
    workflowInstanceId
    buildId
    eventType
    activityName
    oldStatus
    newStatus
    stateSnapshot
    errorMessage
    recordedAt
    executionStarted
    executionCompleted
    elapsedMilliseconds
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class WorkflowHistoryAddedGQL extends Apollo.Subscription<WorkflowHistoryAddedSubscription, WorkflowHistoryAddedSubscriptionVariables> {
    document = WorkflowHistoryAddedDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
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