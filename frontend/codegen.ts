import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '../backend/src/FactoryApp.WebApi/schema.graphql',
  documents: 'src/**/*.graphql',
  generates: {
    'src/app/api/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-apollo-angular',
      ],
      config: {
        skipTypename: false,
        strictScalars: true,
        enumsAsTypes: true,
        onlyOperationTypes: true,
        scalars: {
          DateTime: 'Date',
          Decimal: 'number',
          Long: 'number',
        },
      },
    },
  },
};

export default config;
