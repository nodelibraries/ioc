# GitHub Actions Workflows

## NPM Publish Workflow

Bu workflow, `main` branch'e push yapıldığında otomatik olarak:

1. ✅ Testleri çalıştırır
2. ✅ Kodu build eder
3. ✅ Version kontrolü yapar:
   - Eğer `package.json`'daki version npm'deki ile aynıysa → patch version artırır
   - Eğer farklıysa → mevcut version'ı kullanır
4. ✅ npm'e publish eder
5. ✅ Version bump commit'ini `[skip ci]` ile push eder (infinite loop önleme)

### Kurulum

**NPM_TOKEN Secret'ını GitHub'a ekleyin:**

1. npm.com'a giriş yapın
2. Profile → Access Tokens → Generate New Token (Classic)
3. Token tipi: **Automation** (publish için gerekli)
4. Token'ı kopyalayın
5. GitHub Repository → Settings → Secrets and variables → Actions
6. "New repository secret" → Name: `NPM_TOKEN`, Value: (token'ı yapıştırın)

### Nasıl Çalışır?

- **Normal commit:** Main'e push → Test → Build → Version kontrol → Publish
- **Version bump commit:** `[skip ci]` içeren commit'ler workflow'u tetiklemez (infinite loop önleme)
- **Docs/Examples değişiklikleri:** Workflow tetiklenmez (sadece kod değişikliklerinde çalışır)

### Manuel Version Bump

Eğer manuel olarak version artırmak isterseniz:

```bash
npm version patch  # veya minor, major
git push origin main
```

Bu durumda workflow mevcut version'ı npm'e publish eder.
