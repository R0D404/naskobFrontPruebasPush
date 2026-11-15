# Tecnologías y estructura del proyecto — NasKob

Documento único con el stack que utiliza la aplicación y la organización de carpetas por capas.

---

## 1. Tecnologías

### Stack principal

| Tecnología | Versión | Uso en el proyecto |
| --- | --- | --- |
| React | 19 | Construcción de la interfaz mediante componentes y hooks |
| React DOM | 19 | Renderizado de la aplicación en el navegador |
| TypeScript | 5.7 | Tipado estático estricto de todo el código |
| Vite | 6 | Servidor de desarrollo, HMR y empaquetado de producción |
| React Router DOM | 7 | Navegación SPA y rutas protegidas |
| Tailwind CSS | 3.4 | Estilos utilitarios y sistema de diseño |
| Lucide React | 1.72 | Iconografía vectorial |
| vite-plugin-pwa | 0.21 | Manifest, Service Worker e instalación como PWA |
| Workbox | vía vite-plugin-pwa | Precaching y funcionamiento offline |

### Herramientas de desarrollo

| Herramienta | Uso |
| --- | --- |
| npm | Gestión de dependencias y ejecución de scripts |
| PostCSS | Procesamiento de CSS |
| Autoprefixer | Compatibilidad CSS entre navegadores |
| @vitejs/plugin-react | Soporte de React y Fast Refresh en Vite |
| @types/react / @types/react-dom | Tipos de React |
| @types/node | Tipos para la configuración de Vite |

### Tecnologías del navegador utilizadas

| API | Uso |
| --- | --- |
| Fetch API | Comunicación HTTP con el backend, aislada en la capa de infraestructura |
| `AbortController` / `AbortSignal` | Cancelación y timeout de solicitudes |
| `localStorage` | Persistencia del tema visual y la escala tipográfica |
| `Blob` y `URL.createObjectURL` | Descarga de archivos JSON y CSV |
| `window.print()` | Impresión del resumen técnico |
| SVG nativo | Gráficas agroclimáticas y mapa interactivo, sin librerías externas |
| Service Worker + Cache API | Funcionamiento offline mediante Workbox |

### Patrones y decisiones técnicas

- **Arquitectura por capas (clean / hexagonal)**: dominio, aplicación, infraestructura y presentación.
- **Puertos y adaptadores**: el dominio define interfaces y la infraestructura las implementa.
- **Inyección de dependencias** mediante un composition root.
- **Funciones puras** para las reglas de negocio.
- **Fuente de datos conmutable** entre mocks locales y API HTTP real.

### Lo que no se utiliza

- Sin framework meta (Next.js, Remix, Astro).
- Sin librería externa de componentes ni de gráficas.
- Sin gestor de estado global (Redux, Zustand, MobX).
- Sin backend incluido en el repositorio: por defecto se trabaja con datos mock.
- Sin framework de pruebas configurado actualmente.
- Sin CSS-in-JS ni librería de internacionalización.

---

## 2. Estructura de carpetas

Vista de directorios, sin archivos:

```text
NASKOB/
├── public/
├── src/
│   ├── domain/
│   │   ├── models/
│   │   ├── catalog/
│   │   ├── rules/
│   │   ├── ports/
│   │   └── errors/
│   ├── application/
│   │   ├── dto/
│   │   ├── ports/
│   │   └── services/
│   ├── infrastructure/
│   │   ├── api/
│   │   │   └── repositories/
│   │   ├── mock/
│   │   │   └── repositories/
│   │   ├── storage/
│   │   └── files/
│   └── presentation/
│       ├── components/
│       │   ├── ui/
│       │   ├── domain/
│       │   └── layout/
│       ├── context/
│       ├── hooks/
│       └── views/
└── (configuración del proyecto en la raíz)
```

---

## 3. Explicación de cada carpeta

### Raíz del proyecto

| Carpeta | Qué contiene |
| --- | --- |
| `public/` | Recursos estáticos que Vite sirve tal cual: iconos de la PWA, favicon, `robots.txt` y demás assets públicos. |
| `src/` | Todo el código fuente de la aplicación, organizado en cuatro capas. |

### Capa de dominio — `src/domain/`

Contiene el negocio puro. No depende de React, del navegador ni de ninguna API.

| Carpeta | Qué contiene |
| --- | --- |
| `models/` | Entidades e interfaces que describen el negocio: parcela, declaración del productor, escenarios, perfil agroclimático, glosario, trazabilidad, etc. |
| `catalog/` | Catálogos de referencia: cultivos disponibles y perfiles de suelo con sus etiquetas y tolerancias. |
| `rules/` | Reglas de negocio como funciones puras: descarte por riego (RC5), manejo de temporadas desconocidas (RN-ESC-02), recomendación de escenarios, simulación de estrés climático, cálculo de áreas, validación de región y búsqueda de glosario. |
| `ports/` | Interfaces que la infraestructura debe implementar: autenticación, escenarios, agroclima, trazabilidad, glosario, parcela y preferencias. |
| `errors/` | Errores de negocio reutilizables, con mensajes aptos para mostrar al usuario. |

### Capa de aplicación — `src/application/`

Orquesta las reglas de dominio y los repositorios para ejecutar casos de uso concretos.

| Carpeta | Qué contiene |
| --- | --- |
| `dto/` | Objetos de transferencia entre la presentación y los casos de uso: solicitud de autenticación y datos del resumen exportable. |
| `ports/` | Puertos de salida de la aplicación, como la abstracción para descargar archivos e imprimir. |
| `services/` | Casos de uso: autenticación, evaluación y simulación de escenarios, perfil agroclimático, trazabilidad, glosario, parcela y construcción de exportaciones JSON/CSV. |

### Capa de infraestructura — `src/infrastructure/`

Implementa los puertos del dominio y de la aplicación con tecnologías concretas.

| Carpeta | Qué contiene |
| --- | --- |
| `api/` | Capa de conexión a la API: configuración por variables de entorno, cliente HTTP único, rutas de los endpoints, contratos de respuesta, conversión a modelos de dominio y repositorios HTTP. |
| `api/repositories/` | Implementaciones de los puertos que consumen el backend real mediante el cliente HTTP. |
| `mock/` | Datos de ejemplo y repositorios simulados que permiten trabajar sin backend. |
| `mock/repositories/` | Implementaciones de los puertos que devuelven los datos mock con una latencia simulada. |
| `storage/` | Persistencia local del navegador, como el tema visual y la escala tipográfica. |
| `files/` | Operaciones de archivo del navegador: descarga de JSON/CSV e impresión. |

### Capa de presentación — `src/presentation/`

Todo lo visual y la interacción con el usuario.

| Carpeta | Qué contiene |
| --- | --- |
| `components/` | Componentes reutilizables de React, agrupados por tipo. |
| `components/ui/` | Design system propio: botones, tarjetas, campos, modales, sliders, badges, etc. |
| `components/domain/` | Componentes con lógica visual del negocio: mapa interactivo, gráfica agroclimática, tarjetas de escenario y panel de trazabilidad. |
| `components/layout/` | Estructura de la interfaz: cabecera, navegación y progreso del flujo. |
| `context/` | Contexto de React para temas visuales, escala tipográfica y preferencias de accesibilidad. |
| `hooks/` | Hooks que conectan las vistas con los servicios de aplicación y gestionan estado de carga, error y datos. |
| `views/` | Pantallas del flujo: inicio de sesión, parcela, historial, manejo, perfil agroclimático, escenarios, sensibilidad, resumen y glosario. |

### Composición

En `src/` también vive el punto de composición de la aplicación, que decide si se usan datos mock o la API real y construye los servicios que consumen los hooks. Es el único lugar que conoce simultáneamente las interfaces y sus implementaciones.

---

## 4. Dirección de dependencias

```text
presentation ──▶ application ──▶ domain ◀── infrastructure
```

- `domain` no conoce a nadie fuera de sí mismo.
- `application` depende solo de `domain`.
- `infrastructure` implementa los puertos de `domain` y de `application`.
- `presentation` consume servicios y DTOs, nunca `fetch` ni mocks directamente.
- La composición es la única capa que une todas las piezas.

---

## 5. Variables de entorno

```env
# "mock" (por defecto) o "api"
VITE_DATA_SOURCE=mock

# URL base del backend (solo con VITE_DATA_SOURCE=api)
VITE_API_BASE_URL=/api

# Timeout de cada solicitud HTTP, en milisegundos
VITE_API_TIMEOUT_MS=15000
```

Con `VITE_DATA_SOURCE=mock` la aplicación funciona sin backend. Con `VITE_DATA_SOURCE=api` consume los endpoints definidos en la capa `src/infrastructure/api/`.
