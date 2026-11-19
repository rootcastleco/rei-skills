---
name: abp-localization
description: "ABP Framework v10.4 localization: localization resource, JSON files, culture fallback, L[] helper, IStringLocalizer. Use for multi-language, localization, or translation in ABP."
---

# ABP Localization Skill

## Trigger
User asks about localization, internationalization, i18n, localization resources, JSON localization files, culture, L[] helper, multi-language support, or text translation in ABP Framework.

---

## Core Concepts

ABP's localization system extends `Microsoft.Extensions.Localization` with:
- **Localization Resources** — Group related localization strings
- **JSON Files** — Store translations in embedded JSON files
- **Culture Fallback** — Automatic fallback to default culture
- **Virtual File System** — Embed resources in assemblies
- **L[] Helper** — Convenient access to localized strings

---

## Creating a Localization Resource

### Resource Class

```csharp
public class BookStoreResource
{
}
```

Plain class — no base class needed.

### Register the Resource

```csharp
[DependsOn(typeof(AbpLocalizationModule))]
public class MyModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        // Add embedded JSON files from assembly
        Configure<AbpVirtualFileSystemOptions>(options =>
        {
            options.FileSets.AddEmbedded<MyModule>("YourRootNamespace");
        });

        // Register localization resource
        Configure<AbpLocalizationOptions>(options =>
        {
            options.Resources
                .Add<BookStoreResource>("en")  // Default culture
                .AddVirtualJson("/Localization/Resources/BookStore");
        });
    }
}
```

### JSON File Structure

`/Localization/Resources/BookStore/en.json`:
```json
{
  "culture": "en",
  "texts": {
    "HelloWorld": "Hello World!",
    "Menu:Home": "Home",
    "Menu:BookStore": "Book Store",
    "Permission:BookStore_Author_Create": "Creating a new author"
  }
}
```

`/Localization/Resources/BookStore/tr.json`:
```json
{
  "culture": "tr",
  "texts": {
    "HelloWorld": "Merhaba Dünya!",
    "Menu:Home": "Ana Sayfa",
    "Menu:BookStore": "Kitap Mağazası",
    "Permission:BookStore_Author_Create": "Yeni yazar oluşturma"
  }
}
```

**Important:**
- Every file must define `culture` code — ABP ignores files without it
- `texts` section contains key-value pairs
- Keys can have spaces

---

## Nested Keys and Arrays

### Nested Objects
```json
{
  "culture": "en",
  "texts": {
    "Hello": {
      "World": "Hello World!"
    }
  }
}
```
Access: `L["Hello__World"]` (double underscore separates parent from child)

### Arrays
```json
{
  "culture": "en",
  "texts": {
    "Hi": [
      { "Bye": "Bye World!" },
      { "Hello": "Hello World!" }
    ]
  }
}
```
Access: `L["Hi__0"]` → "Bye World!", `L["Hi__1"]` → "Hello World!"

---

## Multiple Files per Culture

Split large modules into multiple files:

```
Localization/
└── MyResource/
    ├── en.json            ← base / shared strings
    ├── en_Authors.json    ← Author feature strings
    ├── en_Books.json      ← Book feature strings
    └── en_Users.json      ← User feature strings
```

Files are automatically merged. Useful for large modules where splitting by feature keeps files manageable.

---

## Using Localization

### In Application Services / Domain Services

```csharp
public class BookAppService : ApplicationService
{
    public BookAppService()
    {
        LocalizationResource = typeof(BookStoreResource);
    }

    public void DoWork()
    {
        var text = L["HelloWorld"];
        var localized = L["Menu:BookStore"];
    }
}
```

### In Any Service (via IStringLocalizer)

```csharp
public class MyService : ITransientDependency
{
    private readonly IStringLocalizer<BookStoreResource> _localizer;

    public MyService(IStringLocalizer<BookStoreResource> localizer)
    {
        _localizer = localizer;
    }

    public void DoWork()
    {
        var text = _localizer["HelloWorld"];
    }
}
```

### In Controllers

```csharp
public class BookController : AbpController
{
    public BookController()
    {
        LocalizationResource = typeof(BookStoreResource);
    }

    public IActionResult Index()
    {
        ViewData["Title"] = L["Menu:BookStore"];
        return View();
    }
}
```

### In Razor Views

```html
@using Volo.Abp.Localization
@inject IStringLocalizer<BookStoreResource> L

<h1>@L["HelloWorld"]</h1>
<p>@L["Menu:BookStore"]</p>
```

---

## Culture Configuration

### Default Culture

```csharp
Configure<AbpLocalizationOptions>(options =>
{
    options.Languages.Add(new LanguageInfo("en", "en", "English"));
    options.Languages.Add(new LanguageInfo("tr", "tr", "Türkçe"));
    options.DefaultResourceType = typeof(BookStoreResource);
});
```

### Culture Fallback

If a key doesn't exist in the current culture, ABP falls back to:
1. Default culture (e.g., "en")
2. Returns the key itself if not found anywhere

---

## URL-Based Localization

ABP supports culture in URL path:
- `/en/Home` → English
- `/tr/Home` → Turkish

Configure in `appsettings.json`:
```json
{
  "App": {
    "SupportedCultures": ["en", "tr", "de"]
  }
}
```

---

## Best Practices

1. **One resource per module** — Keep localization scoped to modules
2. **Use prefixes in keys** — `Menu:`, `Permission:`, `Error:` for organization
3. **Split large files** — Use multiple files per culture for big modules
4. **Always define culture** — ABP ignores JSON files without `culture` field
5. **Use Virtual File System** — Embed JSON files in assembly for distribution
6. **Set LocalizationResource** — In base classes to avoid repetition
7. **Localize everything user-facing** — Menu items, error messages, permission names
8. **Use consistent key naming** — `Module:Feature:Key` pattern

---

## Common Patterns

### Base App Service with Localization

```csharp
public abstract class BookStoreAppService : ApplicationService
{
    protected BookStoreAppService()
    {
        LocalizationResource = typeof(BookStoreResource);
    }
}
```

### Localized Permission Names

```csharp
myGroup.AddPermission(
    "BookStore_Author_Create",
    LocalizableString.Create<BookStoreResource>("Permission:BookStore_Author_Create")
);
```

### Localized Exception Messages

```csharp
throw new UserFriendlyException(L["Error:InsufficientStock"]);
```

---

## Related

- [Virtual File System](https://abp.io/docs/latest/framework/infrastructure/virtual-file-system) — Embedding resources
- [Localization](https://abp.io/docs/latest/framework/fundamentals/localization) — Culture in URLs
- [Microsoft.Extensions.Localization](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/localization) — Microsoft's localization docs
