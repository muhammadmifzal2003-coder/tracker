// Test double for the slice of the Supabase client the core functions use.
// Each query resolves to the result registered for (table, operation).
type Result = { data?: unknown; error?: { code?: string; message: string } | null }
type Op = 'select' | 'insert' | 'update' | 'delete' | 'upsert'

export type Call = { table: string; op: Op; args: unknown[]; filters: [string, unknown[]][] }

export function fakeSupabase(opts: {
  user: { id: string } | null
  results?: Partial<Record<`${string}.${Op}`, Result>>
  rpc?: Record<string, Result>
}) {
  const calls: Call[] = []
  const client = {
    auth: { getUser: async () => ({ data: { user: opts.user }, error: null }) },
    rpc: async (name: string) => opts.rpc?.[name] ?? { data: [], error: null },
    from(table: string) {
      let call: Call | null = null
      const chain: Record<string, unknown> = {}
      const handler: ProxyHandler<object> = {
        get(_t, prop: string) {
          if (prop === 'then') {
            const r = (call && opts.results?.[`${table}.${call.op}`]) ?? { data: null, error: null }
            return (resolve: (v: Result) => void) => resolve({ data: r.data ?? null, error: r.error ?? null })
          }
          return (...args: unknown[]) => {
            if (['select', 'insert', 'update', 'delete', 'upsert'].includes(prop) && (!call || prop !== 'select')) {
              call = { table, op: prop as Op, args, filters: [] }
              calls.push(call)
            } else if (call) {
              call.filters.push([prop, args])
            }
            return proxy
          }
        },
      }
      const proxy = new Proxy(chain, handler)
      return proxy
    },
  }
  return { client: client as never, calls }
}
