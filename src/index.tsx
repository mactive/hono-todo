import { Hono } from 'hono'
import { renderer } from './renderer'
type Bindings = {
  MY_NAME: string
  MY_KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(renderer)



app.get('/', (c) => {
  return c.render(<h1>Hello, Cloudflare Pages! @mactive</h1>)
})

app.get('/kv', async (c) => {
  await c.env.MY_KV.put('name', c.env.MY_NAME)
  await c.env.MY_KV.put('title', 'hono todo')
  const name = await c.env.MY_KV.get('name')
  const title = await c.env.MY_KV.get('title')
  const date = await c.env.MY_KV.get('date')
  return c.render(<h1>Hello! {name} <br /> {title} <br /> {date}</h1>)
})

export default app


