# .NET Core'da Olup Bizde Olmayan Özellikler

Bu doküman .NET Core Dependency Injection'da olup bizim implementasyonumuzda **henüz bulunmayan** özellikleri listeler.

## ❌ Eksik Özellikler

### 1. **Open Generics (Açık Generic Tipler)**

**.NET:**

```csharp
// Generic interface
interface IRepository<T> { }

// Open generic registration
services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

// Kullanım
class UserService {
    public UserService(IRepository<User> userRepo) { }
}
```

**Bizde:**

- ❌ Open generics desteği yok
- Her generic tip için ayrı registration gerekir
- **Neden eksik:** TypeScript/JavaScript'te generic'ler runtime'da yok, compile-time only

---

### 2. **IDisposable Pattern (Otomatik Dispose)**

**.NET:**

```csharp
class MyService : IDisposable {
    public void Dispose() {
        // Cleanup
    }
}

// Scope dispose edildiğinde otomatik olarak Dispose() çağrılır
```

**Bizde:**

- ✅ `onDestroy()` lifecycle hook var (benzer işlev)
- ❌ `IDisposable` interface pattern'i yok
- ❌ Otomatik dispose detection yok (interface kontrolü ile)

---

### 3. **ServiceProviderOptions**

**.NET:**

```csharp
var options = new ServiceProviderOptions {
    ValidateScopes = true,
    ValidateOnBuild = true
};

var provider = services.BuildServiceProvider(options);
```

**Bizde:**

- ✅ `validateScopes` option var
- ❌ `validateOnBuild` yok (build sırasında validation)
- ❌ Diğer options yok

---

### 4. **ServiceDescriptor API (Manipulation)**

**.NET:**

```csharp
// Descriptor'ları direkt manipüle etme
var descriptor = ServiceDescriptor.Singleton<ILogger, Logger>();
services.Add(descriptor);

// Descriptor'ları okuma
var descriptors = services.Where(d => d.ServiceType == typeof(ILogger));
```

**Bizde:**

- ❌ ServiceDescriptor'ları direkt oluşturma API'si yok
- ❌ Descriptor'ları query etme API'si yok
- ❌ Descriptor collection'ı public değil

---

### 5. **ServiceCollection Extension Methods**

**.NET:**

```csharp
// Extension methods ile kolay registration
services.AddLogging();
services.AddHttpClient();
services.AddDbContext<MyContext>();
```

**Bizde:**

- ❌ Extension method pattern'i yok (TypeScript'te farklı)
- ❌ Helper method'lar yok (örn: `AddLogging()`, `AddHttpClient()`)

---

### 6. **ServiceProvider.GetService<T>() (Nullable Return)**

**.NET:**

```csharp
// GetService - null dönebilir
var logger = provider.GetService<ILogger>(); // ILogger | null

// GetRequiredService - exception fırlatır
var logger = provider.GetRequiredService<ILogger>(); // ILogger
```

**Bizde:**

- ✅ `getService<T>()` var (Promise<T | undefined>)
- ✅ `getRequiredService<T>()` var (Promise<T>)
- ⚠️ Fark: Bizde async, .NET'te sync

---

### 7. **ServiceProvider.GetServices<T>() (IEnumerable)**

**.NET:**

```csharp
// Tüm implementasyonları al
var writers = provider.GetServices<IMessageWriter>(); // IEnumerable<IMessageWriter>

// Constructor'da otomatik inject
class Service {
    public Service(IEnumerable<IMessageWriter> writers) { }
}
```

**Bizde:**

- ✅ `getServices<T>()` var (Promise<T[]>)
- ❌ Constructor'da otomatik `IEnumerable<T>` inject yok
- ⚠️ Manuel olarak `getServices()` çağrılmalı

---

### 8. **ServiceProvider.CreateAsyncScope()**

**.NET (.NET 6+):**

```csharp
// Async scope creation
await using var scope = provider.CreateAsyncScope();
var service = scope.ServiceProvider.GetRequiredService<IService>();
```

**Bizde:**

- ✅ `createScope()` var
- ❌ `createAsyncScope()` yok (ama zaten async pattern kullanıyoruz)

---

### 9. **ServiceProvider.GetKeyedService<T>() (Keyed Services)**

**.NET (.NET 8+):**

```csharp
services.AddKeyedSingleton<ICache, BigCache>("big");
services.AddKeyedSingleton<ICache, SmallCache>("small");

// Key ile resolve
var cache = provider.GetKeyedService<ICache>("big");
```

**Bizde:**

- ✅ `addKeyedSingleton/Scoped/Transient` var
- ✅ `getKeyedService<T>()` var
- ✅ Tam destek var!

---

### 10. **ServiceProvider.GetRequiredKeyedService<T>()**

**.NET (.NET 8+):**

```csharp
var cache = provider.GetRequiredKeyedService<ICache>("big"); // Exception if not found
```

**Bizde:**

- ❌ `getRequiredKeyedService<T>()` yok
- ⚠️ `getKeyedService()` kullanıp manuel check gerekir

---

### 11. **ServiceProvider.GetService(Type) (Non-Generic)**

**.NET:**

```csharp
// Type ile resolve (generic olmayan)
var service = provider.GetService(typeof(ILogger)); // object | null
```

**Bizde:**

- ❌ Non-generic `getService(Type)` yok
- ⚠️ Sadece generic method'lar var

---

### 12. **ServiceProvider.IsService(Type)**

**.NET (.NET 6+):**

```csharp
// Service kayıtlı mı kontrol et
if (provider.IsService(typeof(ILogger))) {
    // Service available
}
```

**Bizde:**

- ❌ `isService<T>()` method'u yok
- ⚠️ `getService()` çağırıp undefined check yapılmalı

---

### 13. **ServiceCollection.Remove() / RemoveAll()**

**.NET:**

```csharp
// Service'i kaldır
services.Remove(ServiceDescriptor.Singleton<ILogger, Logger>());
services.RemoveAll<ILogger>(); // Tüm ILogger kayıtlarını kaldır
```

**Bizde:**

- ❌ `remove()` method'u yok
- ❌ `removeAll()` method'u yok
- ⚠️ Service'leri kaldıramıyoruz

---

### 14. **ServiceCollection.Replace()**

**.NET:**

```csharp
// Mevcut service'i değiştir
services.Replace(ServiceDescriptor.Singleton<ILogger, NewLogger>());
```

**Bizde:**

- ❌ `replace()` method'u yok
- ⚠️ Son registration override eder (replace gibi çalışır ama explicit değil)

---

### 15. **ServiceCollection.TryAddEnumerable()**

**.NET:**

```csharp
// Sadece aynı implementation yoksa ekle (multiple implementations için)
services.TryAddEnumerable(ServiceDescriptor.Singleton<IMessageWriter, ConsoleWriter>());
services.TryAddEnumerable(ServiceDescriptor.Singleton<IMessageWriter, FileWriter>());
```

**Bizde:**

- ❌ `tryAddEnumerable()` yok
- ✅ `tryAddSingleton/Scoped/Transient` var (ama farklı mantık)

---

### 16. **ServiceProvider.GetServices(Type) (Non-Generic)**

**.NET:**

```csharp
// Type ile tüm implementasyonları al
var services = provider.GetServices(typeof(IMessageWriter)); // IEnumerable<object>
```

**Bizde:**

- ❌ Non-generic `getServices(Type)` yok

---

### 17. **ServiceProvider.CreateScope() with IServiceScope Interface**

**.NET:**

```csharp
// IServiceScope interface
using (var scope = provider.CreateScope()) {
    var service = scope.ServiceProvider.GetRequiredService<IService>();
} // Otomatik dispose
```

**Bizde:**

- ✅ `createScope()` var
- ❌ `IServiceScope` interface'i yok
- ✅ `dispose()` method'u var

---

### 18. **ServiceProvider.GetService<T>(object key) (Generic Keyed)**

**.NET (.NET 8+):**

```csharp
// Generic key type
services.AddKeyedSingleton<ICache, BigCache>(42); // int key
var cache = provider.GetKeyedService<ICache>(42);
```

**Bizde:**

- ✅ `getKeyedService<T>(token, key)` var
- ⚠️ Key type: `string | symbol` (generic değil)

---

### 19. **ServiceProvider Validation on Build**

**.NET:**

```csharp
var options = new ServiceProviderOptions {
    ValidateOnBuild = true // Build sırasında tüm dependency'leri validate et
};

var provider = services.BuildServiceProvider(options);
// Eğer bir dependency eksikse, build sırasında exception fırlatır
```

**Bizde:**

- ❌ `validateOnBuild` yok
- ⚠️ İlk resolve sırasında hata fırlatılır

---

### 20. **ServiceProvider.GetService<T>() with Factory**

**.NET:**

```csharp
// Factory pattern ile service oluşturma
services.AddSingleton<IService>(sp => {
    var dep = sp.GetRequiredService<IDependency>();
    return new Service(dep);
});
```

**Bizde:**

- ✅ Factory pattern var (`ServiceFactory<T>`)
- ✅ Tam destek var!

---

## 📊 Özet Tablo

| Özellik                   | .NET Core | Bizim Implementasyon | Öncelik                           |
| ------------------------- | --------- | -------------------- | --------------------------------- |
| Open Generics             | ✅        | ❌                   | Düşük (TypeScript'te zor)         |
| IDisposable Pattern       | ✅        | ⚠️ (onDestroy var)   | Orta                              |
| ServiceProviderOptions    | ✅        | ⚠️ (Kısmi)           | Orta                              |
| ServiceDescriptor API     | ✅        | ❌                   | Düşük                             |
| Extension Methods         | ✅        | ❌                   | Düşük (TypeScript pattern farklı) |
| GetService (Nullable)     | ✅        | ✅                   | -                                 |
| GetServices (IEnumerable) | ✅        | ✅                   | -                                 |
| CreateAsyncScope          | ✅        | ⚠️ (createScope var) | Düşük                             |
| Keyed Services            | ✅        | ✅                   | -                                 |
| GetRequiredKeyedService   | ✅        | ❌                   | Orta                              |
| GetService(Type)          | ✅        | ❌                   | Düşük                             |
| IsService                 | ✅        | ❌                   | Orta                              |
| Remove/RemoveAll          | ✅        | ❌                   | Düşük                             |
| Replace                   | ✅        | ❌                   | Düşük                             |
| TryAddEnumerable          | ✅        | ❌                   | Düşük                             |
| GetServices(Type)         | ✅        | ❌                   | Düşük                             |
| IServiceScope Interface   | ✅        | ⚠️ (Method var)      | Düşük                             |
| Generic Key Types         | ✅        | ⚠️ (string\|symbol)  | Düşük                             |
| ValidateOnBuild           | ✅        | ❌                   | Orta                              |
| Factory Pattern           | ✅        | ✅                   | -                                 |

## 🎯 Öncelikli Eklenecekler

### 🔴 MUST HAVE (Kritik - Mutlaka Gerekli)

1. **GetRequiredKeyedService<T>()** ⭐⭐⭐

   - **Neden kritik:** Keyed services için `getRequiredService()` ile tutarlılık
   - **Kullanım sıklığı:** Keyed services kullanıldığında her zaman gerekli
   - **Workaround:** `getKeyedService()` + manuel null check (hata riski)
   - **Örnek:**

     ```typescript
     // Şu an (hata riski var):
     const cache = await provider.getKeyedService<ICache>(ICacheToken, 'big');
     if (!cache) throw new Error('Cache not found'); // Manuel check gerekli

     // Olması gereken:
     const cache = await provider.getRequiredKeyedService<ICache>(ICacheToken, 'big');
     ```

2. **IsService<T>()** ⭐⭐⭐

   - **Neden kritik:** Service varlık kontrolü çok yaygın kullanılır
   - **Kullanım sıklığı:** Conditional service resolution, plugin systems, optional dependencies
   - **Workaround:** `getService()` çağırıp undefined check (performans kaybı)
   - **Örnek:**

     ```typescript
     // Şu an (gereksiz resolve):
     const logger = await provider.getService<ILogger>(ILoggerToken);
     if (logger) {
       /* use logger */
     }

     // Olması gereken:
     if (await provider.isService<ILogger>(ILoggerToken)) {
       const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
     }
     ```

3. **ValidateOnBuild** ⭐⭐⭐
   - **Neden kritik:** Production'da erken hata tespiti, startup'ta tüm dependency'leri validate eder
   - **Kullanım sıklığı:** Development ve production'da çok önemli
   - **Workaround:** Yok (ilk request'te hata alırsınız - kötü UX)
   - **Örnek:**

     ```typescript
     // Şu an: İlk request'te hata
     const provider = services.buildServiceProvider();
     // ... uygulama başlar, kullanıcı request yapar
     // ❌ Request sırasında hata: "No provider found for token"

     // Olması gereken: Startup'ta hata
     const provider = services.buildServiceProvider({ validateOnBuild: true });
     // ✅ Startup'ta hata: "Missing dependency: ILogger"
     ```

### 🟡 SHOULD HAVE (Önemli - Eklenmeli)

4. **IDisposable Pattern** ⭐⭐
   - **Neden önemli:** Standart pattern, .NET ekosistemiyle uyumluluk
   - **Kullanım sıklığı:** Orta (onDestroy zaten var ama pattern farklı)
   - **Workaround:** `onDestroy()` hook kullanılabilir
   - **Not:** `onDestroy()` zaten var, sadece interface pattern'i eksik

### 🟢 NICE TO HAVE (İyi Olur Ama Zorunlu Değil)

5. **Remove/RemoveAll()** ⭐

   - **Neden faydalı:** Test senaryolarında, dynamic service management
   - **Kullanım sıklığı:** Düşük (çoğu kullanıcı için gerekli değil)
   - **Workaround:** Yeni ServiceCollection oluştur

6. **Replace()** ⭐
   - **Neden faydalı:** Explicit service replacement
   - **Kullanım sıklığı:** Düşük (son registration zaten override ediyor)
   - **Workaround:** Son registration override eder

### ❌ GEREKSIZ (TypeScript'te Farklı Çözüldü)

- **Open Generics** - TypeScript'te runtime generic yok, implement etmek çok zor
- **Non-generic methods** - TypeScript'in type system'i bunu gereksiz kılıyor
- **Extension Methods** - TypeScript'te farklı pattern, helper functions yeterli
- **ServiceDescriptor API** - Advanced use case, çoğu kullanıcı için gerekli değil
- **TryAddEnumerable** - `tryAdd` zaten var, farklı mantık ama yeterli

## 💡 Notlar

- Bazı özellikler TypeScript/JavaScript ekosisteminde farklı pattern'lerle çözülmüş
- Async/await pattern'imiz .NET'ten farklı (bizde async, .NET'te sync)
- TypeScript'in type system'i bazı özellikleri gereksiz kılıyor (örn: non-generic methods)
- Bazı özellikler .NET'e özgü (örn: Extension Methods)
