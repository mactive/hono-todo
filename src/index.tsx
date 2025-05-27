import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { zValidator } from '@hono/zod-validator'
import { PromptSchema, Bindings, Variables } from './types'
import { Database } from './db'
import { renderer } from './renderer'
import Home from './pages'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use('*', async (c, next) => {
  const db = new Database(c.env.DB)
  c.set('db', db)
  await next()
})

app.use('/static/*', serveStatic({ root: './', manifest: {} }))

app.get('/api/prompts', async (c) => {
  const db = c.get('db') as Database
  const prompts = await db.getPrompts()
  return c.json(prompts)
})

app.get('/api/prompts/:id', async (c) => {
  const db = c.get('db') as Database
  const id = parseInt(c.req.param('id'))
  const prompt = await db.getPrompt(id)
  if (!prompt) {
    return c.json({ error: 'Prompt not found' }, 404)
  }
  return c.json(prompt)
})

app.post('/api/prompts', zValidator('json', PromptSchema), async (c) => {
  const db = c.get('db') as Database
  const data = c.req.valid('json')
  const id = await db.createPrompt(data)
  return c.json({ id }, 201)
})

app.put('/api/prompts/:id', zValidator('json', PromptSchema), async (c) => {
  const db = c.get('db') as Database
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')
  await db.updatePrompt(id, data)
  return c.json({ success: true })
})

app.delete('/api/prompts/:id', async (c) => {
  const db = c.get('db') as Database
  const id = parseInt(c.req.param('id'))
  await db.deletePrompt(id)
  return c.json({ success: true })
})

app.get('/api/tags', async (c) => {
  const db = c.get('db') as Database
  const tags = await db.getTags()
  return c.json(tags)
})

app.post('/api/upload', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file') as File
  
  if (!file) {
    return c.json({ error: 'No file provided' }, 400)
  }

  const bucket = c.env.MEDIA_BUCKET
  const key = `${Date.now()}-${file.name}`
  
  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type,
    },
  })

  return c.json({
    url: `/api/media/${key}`,
    type: file.type,
  })
})

app.get('/api/media/:key', async (c) => {
  const key = c.req.param('key')
  const bucket = c.env.MEDIA_BUCKET
  const object = await bucket.get(key)
  
  if (!object) {
    return c.json({ error: 'File not found' }, 404)
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)

  return new Response(object.body, {
    headers,
  })
})

app.get('/', (c) => {
  return c.render(<Home />)
})

app.get('*', renderer)

export default app


