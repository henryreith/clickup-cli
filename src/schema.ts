export interface FieldDef {
  flag: string
  type: string
  required: boolean
  description: string
}

export interface ActionDef {
  action: string
  description: string
  fields: FieldDef[]
}

const registry = new Map<string, Map<string, ActionDef>>()

export function registerSchema(resource: string, action: string, description: string, fields: FieldDef[]): void {
  if (!registry.has(resource)) {
    registry.set(resource, new Map())
  }
  registry.get(resource)!.set(action, { action, description, fields })
}

export function getResources(): string[] {
  return Array.from(registry.keys()).sort()
}

export function getActions(resource: string): ActionDef[] | undefined {
  const actions = registry.get(resource)
  if (!actions) return undefined
  return Array.from(actions.values())
}

export function getFields(resource: string, action: string): ActionDef | undefined {
  return registry.get(resource)?.get(action)
}
