---
applyTo: '**/*.cs'
---

# GitHub Copilot Instructions for C# 9 Development

You are an AI pair programmer specializing in C# 9 development. These instructions apply specifically to `.cs` files in this repository.

## Language Version and Features

- Target Language: C# 9.0
- File Extension: `.cs` files only
- Framework: .NET 5.0 or later

## Project Structure

The project follows a clean architecture pattern with the following folder structure, where `{AppName}` is the name of your application:

1. **{AppName}.Presentation**
   - Contains the WebAPI project
   - Houses all controllers (thin controllers following SRP)
   - Handles HTTP requests and responses
   - API versioning and routing
   - Middleware configurations
   - Request/Response DTOs
   - Input validation using FluentValidation
   - API documentation (Swagger/OpenAPI)

2. **{AppName}.Domain**
   - Core business logic and domain models
   - Rich domain entities with behavior
   - Value objects for immutable concepts
   - Domain events and handlers
   - Domain interfaces (Repository contracts, Service contracts)
   - Business rules and invariants
   - Use cases/Application services
   - Domain exceptions
   - Domain DTOs
   - Specification pattern implementations
   - No dependencies on external frameworks

3. **{AppName}.ExternalService**
   - Infrastructure implementations
   - Repository implementations
   - Unit of Work pattern
   - Database connections and configurations
   - Anti-Corruption Layer (ACL)
   - Redis caching implementation
   - Third-party service adapters
   - External service interfaces
   - Message queue implementations
   - Logging and monitoring
   - Cross-cutting concerns (caching, logging)

Each project should follow strict dependency rules:

- Presentation → Domain
- ExternalService → Domain
- Domain should not depend on other projects

## Coding Standards

1. **Pattern Matching**
   - Prefer using new C# 9 pattern matching features
   - Use pattern matching for type testing and property matching
   - Utilize relational patterns when appropriate

2. **Records**
   - Use records for immutable data models
   - Prefer positional records for simple data transfer objects
   - Use with-expressions for non-destructive mutation

3. **Init-only Properties**
   - Use init-only properties for immutable objects
   - Implement init-only setters for properties that should only be set during initialization

4. **Target-typed New Expressions**
   - Use target-typed new expressions when the type is clear from context
   - Example: `WebApplicationBuilder builder = new();`

5. **Code Organization**
   - Use file-scoped namespaces
   - Keep one main class per file
   - Use partial classes when appropriate

## Best Practices

1. **Null Handling**
   - Use nullable reference types
   - Apply null-forgiving operator (!.) only when necessary
   - Implement proper null checks using pattern matching

2. **Property Patterns**
   - Use property patterns for object matching
   - Implement switch expressions with property patterns
   - Use discards (\_) for unused pattern parts

3. **SOLID Principles & Clean Code**
   - **Single Responsibility Principle (SRP)**
     - Each class should have only one reason to change
     - Keep classes focused and cohesive
     - Split large classes into smaller, focused ones
     - Example: Separate data access, business logic, and presentation logic

   - **Open/Closed Principle (OCP)**
     - Classes should be open for extension but closed for modification
     - Use interfaces and abstract classes for extensibility
     - Implement strategy pattern for varying behaviors
     - Avoid modifying existing code; extend instead

   - **Liskov Substitution Principle (LSP)**
     - Derived classes must be substitutable for their base classes
     - Override base class methods without changing expected behavior
     - Maintain contract consistency in inheritance hierarchies
     - Use covariance and contravariance appropriately

   - **Interface Segregation Principle (ISP)**
     - Keep interfaces small and focused
     - Split large interfaces into smaller ones
     - Clients should not depend on methods they don't use
     - Create role-specific interfaces

   - **Dependency Inversion Principle (DIP)**
     - Depend on abstractions, not concretions
     - Use dependency injection
     - Configure dependencies at composition root
     - Implement repository pattern for data access

   - **Clean Code Practices**
     - Use meaningful and intention-revealing names
     - Keep methods small (preferably under 20 lines)
     - Follow the Don't Repeat Yourself (DRY) principle
     - Comments should explain "why" not "what"
     - Use proper indentation and consistent formatting
     - Follow the Boy Scout Rule: Leave code cleaner than you found it
     - Prefer composition over inheritance
     - Follow Law of Demeter (principle of least knowledge)
     - Use early returns to reduce nesting
     - Keep the code at a single level of abstraction within a method

4. **Performance**
   - Use `Span<T>` and `Memory<T>` for efficient memory operations
   - Implement `IDisposable` pattern when dealing with unmanaged resources
   - Use `System.Threading.Channels` for producer/consumer scenarios

## Documentation

1. **XML Documentation**
   - Document all public members
   - Include exception documentation
   - Provide examples for complex methods

Example:

```csharp
/// <summary>
/// Processes the specified data using the new C# 9 features.
/// </summary>
/// <param name="data">The data to process.</param>
/// <returns>A processed result record.</returns>
/// <exception cref="ArgumentNullException">Thrown when data is null.</exception>
public ProcessResult ProcessData(InputData data)
{
    // Implementation
}
```

## Code Examples

1. **Record Usage**

```csharp
public record Person(string FirstName, string LastName)
{
    public string FullName => $"{FirstName} {LastName}";
}
```

2. **Pattern Matching**

```csharp
public static decimal GetDiscount(Customer customer) =>
    customer switch
    {
        { Loyalty: Premium } => 0.20m,
        { Orders: > 50 } => 0.15m,
        { Orders: > 10 } => 0.10m,
        _ => 0.0m
    };
```

3. **Init-only Properties**

```csharp
public class Configuration
{
    public string ConnectionString { get; init; }
    public int Timeout { get; init; }
}
```

## Testing Guidelines

1. **Unit Tests**
   - Use xUnit or NUnit
   - Follow Arrange-Act-Assert pattern
   - Use meaningful test names

2. **Mock Objects**
   - Use Moq for mocking
   - Mock interfaces rather than classes
   - Keep mocks simple

## Error Handling

1. **Exception Handling**
   - Use specific exception types
   - Implement proper exception filters
   - Log exceptions appropriately

2. **Validation**
   - Use guard clauses
   - Implement Data Annotations for model validation
   - Use FluentValidation when appropriate

## Security Considerations

1. **Input Validation**
   - Validate all inputs
   - Use parameterized queries
   - Implement proper authentication and authorization

2. **Data Protection**
   - Use encryption for sensitive data
   - Implement proper key management
   - Follow GDPR and other relevant regulations
