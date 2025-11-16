# Generic Type Parameters Example

Explains the purpose of generic type parameters (`<T>`) in the container - type safety, IntelliSense, and compile-time checking.

## Code

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

/**
 * Generic Type Parameters Example
 *
 * This example explains the purpose of generic type parameters (<T>) in the container.
 *
 * Benefits:
 * - Type safety: Ensures implementation matches the interface
 * - IntelliSense/Autocomplete: IDE can suggest correct methods
 * - Compile-time checking: Catches type errors before runtime
 * - Return type inference: getService<T>() returns the correct type
 */

interface ILogger {
  log(message: string): void;
}

interface IEmailService {
  sendEmail(to: string, subject: string): void;
}

class Logger implements ILogger {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

class EmailService implements IEmailService {
  sendEmail(to: string, subject: string) {
    console.log(`Sending email to ${to}: ${subject}`);
  }
}

// Tokens
const ILoggerToken = Symbol('ILogger');
const IEmailServiceToken = Symbol('IEmailService');

async function main() {
  console.log('=== Generic Type Parameter Usage ===\n');

  const services = new ServiceCollection();

  // ============================================
  // 1. TYPE SAFETY - Prevents wrong implementation
  // ============================================
  console.log('--- 1. Type Safety ---');

  // ✅ CORRECT: Logger implements ILogger
  services.addSingleton<ILogger>(ILoggerToken, Logger);

  // ❌ ERROR: EmailService does not implement ILogger!
  // services.addSingleton<ILogger>(ILoggerToken, EmailService);
  // TypeScript error: Type 'EmailService' is not assignable to type 'ILogger'

  // ✅ CORRECT: EmailService implements IEmailService
  services.addSingleton<IEmailService>(IEmailServiceToken, EmailService);

  // ============================================
  // 2. RETURN TYPE INFERENCE - getService returns the correct type
  // ============================================
  console.log('\n--- 2. Return Type Inference ---');

  const provider = services.buildServiceProvider();

  // ✅ Thanks to generic type, TypeScript knows logger is ILogger
  const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
  logger.log('Hello from logger'); // ✅ TypeScript recognizes log() method

  // ❌ Without generic type:
  // const logger2 = await provider.getRequiredService(ILoggerToken);
  // logger2.log('Hello'); // ❌ TypeScript doesn't recognize log() method (any type)

  // ✅ Same for EmailService
  const emailService = await provider.getRequiredService<IEmailService>(IEmailServiceToken);
  emailService.sendEmail('user@example.com', 'Hello'); // ✅ TypeScript recognizes sendEmail() method

  // ============================================
  // 3. INTELLISENSE/AUTOCOMPLETE - IDE autocomplete
  // ============================================
  console.log('\n--- 3. IntelliSense/Autocomplete ---');
  console.log("When you type 'logger.' in IDE, TypeScript suggests the log() method");
  console.log("When you type 'emailService.' in IDE, TypeScript suggests the sendEmail() method");

  // ============================================
  // 4. COMPILE-TIME TYPE CHECKING
  // ============================================
  console.log('\n--- 4. Compile-Time Type Checking ---');

  // ✅ CORRECT: Method call matches ILogger interface
  logger.log('This works');

  // ❌ ERROR: ILogger interface doesn't have sendEmail()!
  // logger.sendEmail('test', 'test'); // TypeScript error: Property 'sendEmail' does not exist on type 'ILogger'

  // ✅ CORRECT: Method call matches IEmailService interface
  emailService.sendEmail('test@example.com', 'Test');

  // ❌ ERROR: IEmailService interface doesn't have log()!
  // emailService.log('test'); // TypeScript error: Property 'log' does not exist on type 'IEmailService'

  // ============================================
  // 5. USAGE WITHOUT GENERIC TYPE (NOT RECOMMENDED)
  // ============================================
  console.log('\n--- 5. Without Generic Type (Not Recommended) ---');

  // If generic type is not specified, TypeScript cannot infer the type
  const loggerWithoutType = await provider.getRequiredService(ILoggerToken);
  // loggerWithoutType type: any
  // TypeScript doesn't suggest any methods
  // No type safety - you may get runtime errors!

  console.log('\n✅ Generic type parameter usage:');
  console.log('  - Provides type safety');
  console.log('  - IDE autocomplete works');
  console.log('  - Compile-time error checking');
  console.log('  - Code is more readable and safe');
}

main().catch(console.error);
```

## Expected Output

```
=== Generic Type Parameter Usage ===

--- 1. Type Safety ---

--- 2. Return Type Inference ---
[LOG] Hello from logger
Sending email to user@example.com: Hello

--- 3. IntelliSense/Autocomplete ---
When you type 'logger.' in IDE, TypeScript suggests the log() method
When you type 'emailService.' in IDE, TypeScript suggests the sendEmail() method

--- 4. Compile-Time Type Checking ---
[LOG] This works
Sending email to test@example.com: Test

--- 5. Without Generic Type (Not Recommended) ---

✅ Generic type parameter usage:
  - Provides type safety
  - IDE autocomplete works
  - Compile-time error checking
  - Code is more readable and safe
```

## Run This Example

```bash
npx ts-node examples/7-generic-types.ts
```

## Key Points

- **Type Safety**: Ensures implementation matches the interface
- **IntelliSense**: IDE autocomplete works correctly
- **Compile-time Checking**: Catches errors before runtime
- **Return Type Inference**: `getService<T>()` returns the correct type
