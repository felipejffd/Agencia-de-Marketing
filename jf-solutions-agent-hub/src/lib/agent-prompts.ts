export const AGENT_LABELS: Record<string, string> = {
  strategy: "Estrategia",
  content: "Contenido",
  scripts: "Guiones",
  ads: "Publicidad",
  analytics: "Analítica",
  web: "Web",
}

export const VALID_AGENT_TYPES = [
  "strategy",
  "content",
  "scripts",
  "ads",
  "analytics",
  "web",
] as const

export type AgentType = (typeof VALID_AGENT_TYPES)[number]

export function isValidAgentType(type: string): type is AgentType {
  return VALID_AGENT_TYPES.includes(type as AgentType)
}

interface BriefContext {
  businessDescription?: string
  targetAudience?: string
  mainGoal?: string
  creativeIdea?: string
  tone?: string
  competitors?: string
  additionalNotes?: string
  uploadedContent?: string
}

function buildContext(ctx: BriefContext): string {
  const lines: string[] = ["## Contexto del cliente"]
  if (ctx.businessDescription) lines.push(`**Negocio:** ${ctx.businessDescription}`)
  if (ctx.targetAudience) lines.push(`**Audiencia:** ${ctx.targetAudience}`)
  if (ctx.mainGoal) lines.push(`**Meta:** ${ctx.mainGoal}`)
  if (ctx.creativeIdea) lines.push(`**Idea creativa:** ${ctx.creativeIdea}`)
  if (ctx.tone) lines.push(`**Tono:** ${ctx.tone}`)
  if (ctx.competitors) lines.push(`**Competidores:** ${ctx.competitors}`)
  if (ctx.additionalNotes) lines.push(`**Notas:** ${ctx.additionalNotes}`)
  if (ctx.uploadedContent) lines.push(`\n## Brief adicional del cliente\n${ctx.uploadedContent}`)
  return lines.join("\n")
}

const BASE_INSTRUCTIONS = `
Responde siempre en español. Sé concreto, estructurado y accionable.
Usa encabezados con ##, listas con - y negritas con ** para estructurar tu respuesta.
No incluyas introducciones genéricas; ve directo al análisis y las recomendaciones.
`

export function getAgentPrompt(agentType: AgentType, ctx: BriefContext): string {
  const context = buildContext(ctx)

  const prompts: Record<AgentType, string> = {
    strategy: `Eres un estratega de marketing digital experto. ${BASE_INSTRUCTIONS}

${context}

Genera un plan estratégico completo que incluya:
## 1. Análisis DOFA
Fortalezas, Oportunidades, Debilidades y Amenazas del negocio.

## 2. Posicionamiento de marca
Define la propuesta de valor única y el posicionamiento frente a la competencia.

## 3. Objetivos SMART
3-5 objetivos medibles y con plazos definidos.

## 4. Estrategia de canales
Qué canales usar (Instagram, TikTok, LinkedIn, Email, SEO…) y por qué.

## 5. Calendario editorial mensual
Frecuencia y tipo de contenido por canal para los próximos 30 días.

## 6. KPIs clave
Métricas para medir el éxito en cada objetivo.`,

    content: `Eres un estratega de contenido digital experto. ${BASE_INSTRUCTIONS}

${context}

Genera un plan de contenido para redes sociales que incluya:
## 1. Pilares de contenido
3-5 pilares temáticos alineados con la marca y los objetivos.

## 2. Ideas de contenido por pilar
Para cada pilar, 5 ideas concretas de publicaciones con formato sugerido (reel, carrusel, historia, post estático).

## 3. Calendario semanal
Distribución de contenido por día y canal durante una semana tipo.

## 4. Guía de estilo
Tono de voz, palabras clave, emojis permitidos, hashtags recomendados.

## 5. Formatos y especificaciones
Dimensiones y duraciones recomendadas por plataforma.`,

    scripts: `Eres un guionista experto en video marketing. ${BASE_INSTRUCTIONS}

${context}

Genera guiones de video listos para producción:
## 1. Guión para Reels / TikTok (30-60 seg)
Hook, desarrollo y CTA. Incluye indicaciones de B-roll y música.

## 2. Guión para YouTube (2-5 min)
Intro, desarrollo con secciones, outro y CTA de suscripción.

## 3. Guión para Historia de Instagram (15 seg × 3 partes)
Cada parte con texto en pantalla y voz en off opcional.

## 4. Guión de presentación de producto
Estructura de demo o unboxing para cualquier plataforma.

## 5. Plantilla reutilizable
Estructura genérica que el cliente pueda adaptar para futuros videos.`,

    ads: `Eres un especialista en pauta digital y performance marketing. ${BASE_INSTRUCTIONS}

${context}

Genera una estructura completa de campaña publicitaria:
## 1. Estructura de campaña en Meta Ads
Campaña → conjuntos de anuncios → anuncios. Objetivo, presupuesto sugerido y puja.

## 2. Segmentación de audiencias
- Audiencia fría (intereses, demografía)
- Audiencia tibia (retargeting por engagement)
- Audiencia caliente (retargeting por visitas y compradores)

## 3. Copys por formato
- Anuncio de imagen estática
- Anuncio de video (guión 15 seg)
- Anuncio de carrusel (3-5 tarjetas)

## 4. Creatividades sugeridas
Descripción visual de cada anuncio con colores, textos en imagen y llamado a la acción.

## 5. Embudo de conversión
Estrategia TOFU → MOFU → BOFU con métricas objetivo por etapa.

## 6. Plan de optimización
Cuándo pausar, escalar o duplicar conjuntos de anuncios según resultados.`,

    analytics: `Eres un analista de datos de marketing digital experto. ${BASE_INSTRUCTIONS}

${context}

Genera un framework completo de analítica:
## 1. KPIs por objetivo
Para cada meta del cliente, define métrica primaria, secundaria y de vanidad a evitar.

## 2. Dashboard sugerido
Qué métricas monitorear diariamente, semanalmente y mensualmente.

## 3. Configuración recomendada
Google Analytics 4: eventos a trackear, conversiones a configurar.
Meta Pixel: eventos estándar y personalizados necesarios.

## 4. Interpretación de métricas clave
- CTR < 1%: qué significa y cómo mejorar
- CPM alto: causas y soluciones
- Frecuencia > 3: impacto y acciones
- ROAS objetivo según industria

## 5. Rutina de análisis mensual
Proceso paso a paso para revisar resultados y tomar decisiones.

## 6. Plantilla de reporte
Estructura de informe mensual para presentar al cliente.`,

    web: `Eres un consultor de UX/UI y desarrollo web para marketing digital. ${BASE_INSTRUCTIONS}

${context}

Genera un brief técnico completo para el sitio web:
## 1. Arquitectura del sitio
Mapa de páginas con jerarquía y relaciones entre secciones.

## 2. Requisitos por página
Para cada página: objetivo, contenido clave, CTA principal y elementos de conversión.

## 3. Especificaciones técnicas
- Stack recomendado (CMS, framework, hosting)
- Integraciones necesarias (CRM, email marketing, pagos)
- Requisitos de rendimiento (Core Web Vitals objetivo)

## 4. Guía UX/UI
- Paleta de colores y tipografía
- Patrones de navegación
- Puntos de conversión y formularios
- Mobile-first: breakpoints críticos

## 5. SEO on-page
- Estructura de URLs
- Meta tags por página
- Schema markup recomendado
- Estrategia de palabras clave

## 6. Checklist de lanzamiento
Lista de verificación técnica antes de publicar el sitio.`,
  }

  return prompts[agentType]
}
