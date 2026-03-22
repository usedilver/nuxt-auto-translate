# Guía de Uso: Ollama y LM Studio (Modelos Locales)

Esta guía te ayudará a configurar modelos locales de IA para traducciones automáticas usando **Ollama** o **LM Studio**.

## ¿Por qué usar modelos locales?

| Característica | Modelos Locales (Ollama/LM Studio) | APIs en la nube (OpenAI/Anthropic) |
|----------------|-------------------------------------|-------------------------------------|
| **Privacidad** | 100% Privado - Los datos no salen de tu máquina | Los textos se envían a servidores externos |
| **Costo** | Gratis sin límites | Pago por uso ($0.15-$0.25 por 1M tokens) |
| **Internet** | Funciona offline | Requiere conexión a internet |
| **Velocidad** | Muy rápido con GPU | Depende de la red y rate limits |
| **Recursos** | Requiere RAM (8-16GB+) y GPU recomendada | No requiere recursos locales |
| **Calidad** | Depende del modelo (muy buena con modelos grandes) | Excelente calidad |

## Opción 1: Ollama (Recomendado)

### Instalación

#### macOS
```bash
# Opción 1: Descargar desde la web
# https://ollama.com/download

# Opción 2: Homebrew
brew install ollama
```

#### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### Windows
Descargar desde: https://ollama.com/download

### Verificar Instalación

```bash
ollama --version
# Debería mostrar: ollama version 0.x.x
```

### Descargar Modelos

Ollama descarga modelos bajo demanda, pero es mejor descargarlos manualmente primero:

```bash
# Modelo recomendado para Mac M4 Pro: Qwen 2.5 (7B) - Rápido y excelente calidad
ollama pull qwen2.5:7b

# Alternativas según tu hardware:
ollama pull llama3.2:3b      # Ligero (2GB RAM) - Rápido pero menor calidad
ollama pull llama3.2:latest   # Mediano (8GB RAM) - Balance calidad/velocidad
ollama pull qwen2.5:14b       # Grande (16GB RAM) - Mejor calidad
ollama pull qwen2.5:32b       # Muy grande (32GB RAM) - Máxima calidad
```

### Iniciar Ollama

```bash
# Iniciar servidor (se queda ejecutando en background)
ollama serve

# O simplemente ejecuta un modelo y se inicia automáticamente
ollama run qwen2.5:7b
```

### Verificar que Funciona

```bash
curl http://localhost:11434/api/tags
# Debería listar los modelos instalados
```

### Configuración en nuxt.config.ts

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-auto-translate'],

  autoTranslate: {
    enabled: true,
    provider: 'ollama',
    defaultLocale: 'es',
    locales: [
      { code: 'es', name: 'Español' },
      { code: 'en', name: 'English' },
    ],
    outputPath: 'public/i18n',
    ollama: {
      model: 'qwen2.5:7b',
      baseUrl: 'http://localhost:11434/v1',
    },
  },
})
```

### O usando variables de entorno (.env)

```bash
# Seleccionar Ollama como provider
NUXT_AUTO_TRANSLATE_PROVIDER=ollama

# Configurar Ollama
NUXT_AUTO_TRANSLATE_OLLAMA_MODEL=qwen2.5:7b
NUXT_AUTO_TRANSLATE_OLLAMA_BASE_URL=http://localhost:11434/v1
```

## Opción 2: LM Studio

### Instalación

1. Descargar desde: https://lmstudio.ai/
2. Instalar la aplicación
3. Abrir LM Studio

### Descargar Modelos

1. En LM Studio, ve a la pestaña "Discover"
2. Busca y descarga uno de estos modelos:
   - **Qwen2.5-7B-Instruct** (Recomendado para M4 Pro)
   - **Llama-3.2-3B-Instruct** (Más ligero)
   - **Mistral-7B-Instruct** (Alternativa)

### Iniciar Servidor

1. Ve a la pestaña "Local Server"
2. Selecciona el modelo descargado
3. Click en "Start Server"
4. El servidor se inicia en `http://localhost:1234`

### Configuración en .env

```bash
# Seleccionar Ollama como provider (LM Studio usa la misma API)
NUXT_AUTO_TRANSLATE_PROVIDER=ollama

# Configurar LM Studio (puerto diferente a Ollama)
NUXT_AUTO_TRANSLATE_OLLAMA_MODEL=qwen2.5-7b-instruct
NUXT_AUTO_TRANSLATE_OLLAMA_BASE_URL=http://localhost:1234/v1
```

## Modelos Recomendados para MacBook Pro M4 Pro

| Modelo | Tamaño | RAM Requerida | Calidad | Velocidad | Uso Recomendado |
|--------|--------|---------------|---------|-----------|-----------------|
| **Qwen2.5:7b** | 4.7 GB | 8 GB | ★★★★★ | ★★★★ | **Recomendado** - Mejor balance |
| Qwen2.5:14b | 9 GB | 16 GB | ★★★★★ | ★★★ | Mejor calidad si tienes RAM |
| Llama3.2:3b | 2 GB | 4 GB | ★★★ | ★★★★★ | Desarrollo rápido |
| Llama3.2 | 4.7 GB | 8 GB | ★★★★ | ★★★★ | Buena alternativa |
| Mistral:7b | 4.1 GB | 8 GB | ★★★★ | ★★★★ | Bueno para idiomas europeos |

## Uso

Una vez configurado, el sistema de auto-translate funcionará automáticamente:

```bash
# Durante el desarrollo
pnpm dev

# Durante el build
pnpm build
```

Las traducciones se generarán usando tu modelo local sin enviar datos a internet.

## Troubleshooting

### Error: "Connection refused"

**Problema:** Ollama/LM Studio no está ejecutándose.

**Solución:**
```bash
# Ollama
ollama serve

# LM Studio: Click en "Start Server" en la pestaña "Local Server"
```

### Error: "Model not found"

**Problema:** El modelo especificado no está descargado.

**Solución:**
```bash
# Ver modelos disponibles
ollama list

# Descargar modelo
ollama pull qwen2.5:7b

# O en LM Studio: Descarga el modelo desde la pestaña "Discover"
```

### Traducciones lentas

**Problema:** El modelo es demasiado grande para tu hardware.

**Solución:**
1. Usa un modelo más pequeño: `llama3.2:3b`
2. Cierra otras aplicaciones para liberar RAM
3. Considera usar un modelo cuantizado (Q4, Q5)

### Calidad de traducción baja

**Problema:** El modelo pequeño no tiene suficiente capacidad.

**Solución:**
1. Usa un modelo más grande: `qwen2.5:14b`
2. Asegúrate de tener suficiente RAM libre
3. Considera usar Groq (gratis, remoto) si la privacidad no es crítica

## Comparación de Velocidad (MacBook Pro M4 Pro)

Traducción de 100 claves nuevas:

| Provider | Tiempo | Tokens/seg | Costo |
|----------|--------|------------|-------|
| **Qwen2.5:7b (local)** | ~30 seg | ~800 | $0 |
| Llama3.2:3b (local) | ~15 seg | ~1600 | $0 |
| OpenAI gpt-4o-mini | ~25 seg | Variable | ~$0.02 |
| Groq (remoto) | ~10 seg | ~2000 | $0 |

## Recursos Adicionales

- **Ollama**: https://ollama.com/library
- **LM Studio**: https://lmstudio.ai/docs
- **Modelos Qwen**: https://ollama.com/library/qwen2.5
- **Modelos Llama**: https://ollama.com/library/llama3.2
