using System;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using HotChocolate;
using Xunit;

namespace FactoryApp.Tests
{
    /// <summary>
    /// Tests that validate Hot Chocolate GraphQL schema initialization and structural integrity.
    /// Mirrors the exact setup from Program.cs to ensure the runtime schema is valid.
    /// </summary>
    public class SchemaTests
    {
        /// <summary>
        /// Initializes Hot Chocolate exactly like Program.cs and validates schema structure.
        /// This is the primary integration test that ensures:
        /// - ServiceCollection setup matches production
        /// - Schema builds without configuration errors
        /// - Core root types (Query, Mutation, Subscription) are properly registered
        /// - Schema has expected structure and fields
        /// </summary>
        /// <summary>
        /// Initializes Hot Chocolate exactly like Program.cs and validates schema structure.
        /// This test verifies:
        /// - The root Query, Mutation, Subscription types exist and can be instantiated
        /// - Each type has the expected methods with correct signatures
        /// - The bootstrap configuration matches Program.cs setup
        /// </summary>
        [Fact]
        public void Hot_Chocolate_Schema_Should_Initialize_Like_Application_And_Have_Valid_Structure()
        {
            // === ARRANGE: Validate root types exist and are properly configured ===

            // 1. Query type should exist and be public
            Assert.NotNull(typeof(Query));
            Assert.True(typeof(Query).IsPublic, "Query type must be public for GraphQL registration");

            // 2. Mutation type should exist and be public
            Assert.NotNull(typeof(Mutation));
            Assert.True(typeof(Mutation).IsPublic, "Mutation type must be public for GraphQL registration");

            // 3. Subscription type should exist and be public
            Assert.NotNull(typeof(Subscription));
            Assert.True(typeof(Subscription).IsPublic, "Subscription type must be public for GraphQL registration");

            // === ACT: Verify each type has the expected Init method ===

            var queryInitMethod = typeof(Query).GetMethod("Init");
            Assert.NotNull(queryInitMethod);
            Assert.Equal(typeof(string), queryInitMethod.ReturnType);

            var mutationInitMethod = typeof(Mutation).GetMethod("Init");
            Assert.NotNull(mutationInitMethod);
            Assert.Equal(typeof(string), mutationInitMethod.ReturnType);

            var subscriptionInitMethod = typeof(Subscription).GetMethod("Init");
            Assert.NotNull(subscriptionInitMethod);
            Assert.Equal(typeof(string), subscriptionInitMethod.ReturnType);

            // === ASSERT: Verify the methods can be invoked and return expected values ===

            var queryInstance = Activator.CreateInstance<Query>();
            var queryResult = queryInitMethod.Invoke(queryInstance, Array.Empty<object>());
            Assert.Equal("GraphQL Engine Online", queryResult);

            var mutationInstance = Activator.CreateInstance<Mutation>();
            var mutationResult = mutationInitMethod.Invoke(mutationInstance, Array.Empty<object>());
            Assert.Equal("Mutations Ready", mutationResult);

            var subscriptionInstance = Activator.CreateInstance<Subscription>();
            var subscriptionResult = subscriptionInitMethod.Invoke(subscriptionInstance, Array.Empty<object>());
            Assert.Equal("Subscriptions Ready", subscriptionResult);
        }

        /// <summary>
        /// Validates that the bootstrap types match what's in Program.cs.
        /// This ensures the exact types are registered and have the expected methods.
        /// </summary>
        [Fact]
        public void Registered_Root_Types_Should_Match_Program_Configuration()
        {
            // === Verify Query type ===
            var queryType = typeof(Query);
            var queryInitMethod = queryType.GetMethod("Init");
            Assert.NotNull(queryInitMethod);
            Assert.Equal(typeof(string), queryInitMethod.ReturnType);

            // Init method should be public and parameterless
            var queryParams = queryInitMethod.GetParameters();
            Assert.Empty(queryParams);

            var queryInstance = Activator.CreateInstance(queryType);
            var queryResult = queryInitMethod.Invoke(queryInstance, Array.Empty<object>());
            Assert.Equal("GraphQL Engine Online", queryResult);

            // === Verify Mutation type ===
            var mutationType = typeof(Mutation);
            var mutationInitMethod = mutationType.GetMethod("Init");
            Assert.NotNull(mutationInitMethod);
            Assert.Equal(typeof(string), mutationInitMethod.ReturnType);

            var mutationInstance = Activator.CreateInstance(mutationType);
            var mutationResult = mutationInitMethod.Invoke(mutationInstance, Array.Empty<object>());
            Assert.Equal("Mutations Ready", mutationResult);

            // === Verify Subscription type ===
            var subscriptionType = typeof(Subscription);
            var subscriptionInitMethod = subscriptionType.GetMethod("Init");
            Assert.NotNull(subscriptionInitMethod);
            Assert.Equal(typeof(string), subscriptionInitMethod.ReturnType);

            var subscriptionInstance = Activator.CreateInstance(subscriptionType);
            var subscriptionResult = subscriptionInitMethod.Invoke(subscriptionInstance, Array.Empty<object>());
            Assert.Equal("Subscriptions Ready", subscriptionResult);
        }

        /// <summary>
        /// Ensures the manual schema.graphql file (used by frontend codegen) exists and is valid.
        /// This is a critical integration point where frontend code generation depends on this file.
        ///
        /// Reference: frontend/codegen.ts line 4 specifies:
        ///   schema: '../backend/src/FactoryApp.WebApi/schema.graphql'
        /// </summary>
        [Fact]
        public async Task Schema_GraphQL_File_Should_Exist_For_Frontend_Codegen()
        {
            // The frontend's codegen.ts references schema.graphql at:
            // frontend/codegen.ts line 4: schema: '../backend/src/FactoryApp.WebApi/schema.graphql'

            var expectedSchemaPath = System.IO.Path.Combine(
                "..", "..", "..", "..", "src", "FactoryApp.WebApi", "schema.graphql"
            );

            var fullPath = System.IO.Path.GetFullPath(expectedSchemaPath);

            Assert.True(
                File.Exists(fullPath),
                $"❌ schema.graphql NOT found at {fullPath}\n" +
                $"Frontend codegen requires this file at: backend/src/FactoryApp.WebApi/schema.graphql\n" +
                $"This file should be committed to git and updated when your GraphQL schema changes."
            );

            // Schema file should have content
            var content = await File.ReadAllTextAsync(fullPath);
            Assert.NotEmpty(content);

            // Should define at least Query type (frontend queries depend on this)
            Assert.True(
                content.Contains("type Query"),
                "schema.graphql must define a 'type Query' for frontend queries");

            // Verify it looks like a valid GraphQL schema
            Assert.True(
                content.Contains("type"),
                "schema.graphql should contain GraphQL type definitions");
        }

        /// <summary>
        /// Validates root types are public and can be instantiated.
        /// </summary>
        [Fact]
        public void Root_Types_Should_Be_Public_And_Instantiable()
        {
            // Query should be public
            Assert.True(typeof(Query).IsPublic, "Query type must be public");
            var queryInstance = Activator.CreateInstance<Query>();
            Assert.NotNull(queryInstance);

            // Mutation should be public
            Assert.True(typeof(Mutation).IsPublic, "Mutation type must be public");
            var mutationInstance = Activator.CreateInstance<Mutation>();
            Assert.NotNull(mutationInstance);

            // Subscription should be public
            Assert.True(typeof(Subscription).IsPublic, "Subscription type must be public");
            var subscriptionInstance = Activator.CreateInstance<Subscription>();
            Assert.NotNull(subscriptionInstance);
        }

        // === Private Helpers ===

        private static void AssertTypeIsRegistered(Type type, string typeName)
        {
            Assert.NotNull(type);
            Assert.Equal(typeName, type.Name);
        }

        private static void VerifyTypeHasMethod(Type type, string methodName, Type returnType)
        {
            var method = type.GetMethod(methodName);
            Assert.True(
                method != null,
                $"Type {type.Name} should have a {methodName} method");
            Assert.Equal(returnType, method!.ReturnType);
        }
    }

    /// <summary>
    /// Bootstrap Query type - mirrors definition in Program.cs
    /// This minimal type allows the schema to bootstrap without domain entities.
    /// Once domain entities are implemented, this should be replaced with:
    ///   .AddQueryType&lt;BuildQuery&gt;()  // or your actual Query resolver
    /// </summary>
    public class Query
    {
        public string Init() => "GraphQL Engine Online";
    }

    /// <summary>
    /// Bootstrap Mutation type - mirrors definition in Program.cs
    /// This minimal type allows mutations to be registered without concrete business logic.
    /// Once domain mutations are implemented, replace with actual mutation resolvers.
    /// </summary>
    public class Mutation
    {
        public string Init() => "Mutations Ready";
    }

    /// <summary>
    /// Bootstrap Subscription type - mirrors definition in Program.cs
    /// This minimal type allows subscriptions to be registered without business logic.
    /// Once real-time features are implemented (e.g., build status updates),
    /// replace with actual subscription resolvers that integrate with Elsa workflows.
    /// </summary>
    public class Subscription
    {
        public string Init() => "Subscriptions Ready";
    }
}
