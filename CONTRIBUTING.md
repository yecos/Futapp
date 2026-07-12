## 🤝 Cómo Contribuir a Futapp

¡Gracias por tu interés en contribuir! Este documento te guía paso a paso.

### 🚀 Configuración inicial

```bash
# 1. Fork el repositorio en GitHub
# 2. Clona tu fork
git clone https://github.com/TU_USUARIO/Futapp.git
cd Futapp

# 3. Añade el upstream original
git remote add upstream https://github.com/yecos/Futapp.git

# 4. Instala dependencias
bun install  # o: npm install

# 5. Configura variables de entorno
cp .env.example .env

# 6. Inicializa la base de datos
bun run db:push

# 7. Inicia el servidor
bun run dev
```

### 🔄 Flujo de trabajo

1. **Sincroniza con upstream** antes de empezar:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Crea una rama** para tu feature/fix:
   ```bash
   git checkout -b feature/mi-funcion
   # o: fix/mi-fix
   ```

3. **Haz tus cambios** siguiendo el código de estilo:
   - Usa TypeScript estricto
   - Sigue las convenciones de shadcn/ui
   - Mantén componentes pequeños y enfocados
   - Usa los helpers de `src/lib/helpers.ts`

4. **Verifica** que todo funciona:
   ```bash
   bun run lint        # Sin errores de ESLint
   bun run typecheck   # Sin errores de TypeScript
   bun run build       # Build exitoso
   ```

5. **Haz commit** siguiendo [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: añade filtros por posición en plantilla"
   ```

6. **Push y PR**:
   ```bash
   git push origin feature/mi-funcion
   ```
   Luego abre un Pull Request en GitHub.

### 📋 Convención de commits

| Tipo | Uso |
|---|---|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `docs:` | Cambios en documentación |
| `style:` | Formato, no afecta código |
| `refactor:` | Refactorización |
| `test:` | Tests |
| `chore:` | Mantenimiento |

**Ejemplos:**
- `feat: añade vista de pagos y administración`
- `fix: corrige hidratación en SSR`
- `docs: actualiza README con instrucciones de deploy`

### 🎨 Código de estilo

- **Indentación:** 2 espacios
- **Comillas:** simples (`'`)
- **Punto y coma:** no usar
- **Líneas:** máximo 80 caracteres
- **Imports:** ordena alfabéticamente, agrupa por tipo
- **Componentes:** usa `'use client'` solo cuando sea necesario

### 🧪 Testing (próximamente)

Por ahora no hay tests automatizados, pero antes de un PR:
- Prueba la funcionalidad en móvil (375px) y desktop (1280px)
- Verifica que el modo oscuro funciona
- Comprueba que no hay errores en consola

### 📝 Pull Requests

- **Título descriptivo** siguiendo conventional commits
- **Descripción** del qué y por qué (no solo el cómo)
- **Screenshots** si hay cambios visuales
- **Una feature por PR** — facilita la revisión

### 🐛 Reportar bugs

Abre un [issue](https://github.com/yecos/Futapp/issues/new/choose) usando la plantilla de bug report.

### 💡 Sugerir funcionalidades

Abre un [issue](https://github.com/yecos/Futapp/issues/new/choose) con la plantilla de feature request.

### ❓ Preguntas

Abre un [discussion](https://github.com/yecos/Futapp/discussions) en GitHub.

---

¡Gracias por contribuir! ⚽
