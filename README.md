# Finanzas — Fase 1

## Qué incluye esta fase

- Proyecto Next.js + TypeScript + Tailwind
- Autenticación con Supabase (login / registro)
- Esquema completo de base de datos con RLS (`schema.sql`)
- Navegación inferior (Resumen / Movimientos / Analizar / Cuentas)
- PWA instalable en iPhone
- Páginas conectadas de verdad a Supabase (sin datos falsos)

## Pasos para poner esto en marcha

### 1. Ejecutar el esquema en Supabase

1. Entra en tu proyecto de Supabase → **SQL Editor**
2. Abre `schema.sql`, copia todo el contenido, pégalo y pulsa **Run**
3. Deberías ver las tablas creadas en **Table Editor**

### 2. Subir el proyecto a GitHub

1. Crea un nuevo repositorio en GitHub (puede ser privado), por ejemplo `finanzas-app`
2. En la página del repo vacío, pulsa **uploading an existing file**
3. Arrastra **toda la carpeta** `finanzas-app` (el navegador mantiene la estructura de subcarpetas)
4. Confirma el commit

**Importante:** el archivo `.env.local.example` sube a GitHub sin problema, pero nunca subas un archivo llamado `.env.local` con tus claves reales — eso se configura directamente en Vercel (paso 3).

### 3. Desplegar en Vercel

1. En vercel.com, **Add New → Project**, importa el repo `finanzas-app`
2. Antes de darle a Deploy, abre **Environment Variables** y añade:
   - `NEXT_PUBLIC_SUPABASE_URL` → tu URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → tu clave anon
3. Deploy. Vercel compila él solo, no necesitas hacer nada en tu ordenador.

### 4. Instalar en iPhone

Abre la URL de Vercel en Safari → botón compartir → **Añadir a pantalla de inicio**.

### 5. Crear tu usuario

Entra en la URL, pulsa "Regístrate", confirma el email que te llegue, y ya tienes tu primer usuario con las 14 categorías por defecto creadas automáticamente.

---

## Próximas fases

- **Fase 2**: añadir/editar/borrar movimientos y cuentas desde la interfaz, filtros, búsqueda
- **Fase 3**: dashboard completo con gráfico de evolución del patrimonio
- **Fase 4**: importación de CSV con detección de duplicados
- **Fase 5**: aprendizaje de categorización (merchant rules)
- **Fase 6**: saldo real vs calculado, ajustes
- **Fase 7**: inversiones (MyInvestor)
- **Fase 8**: análisis avanzado y comparaciones

Cuando quieras seguir, dime "vamos con la Fase 2" y seguimos desde aquí.
