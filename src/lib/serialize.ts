/** Convert Mongoose docs/ObjectIds/Dates into plain JSON-safe objects for client components. */
export function serialize<T>(data: unknown): T {
  return JSON.parse(JSON.stringify(data)) as T;
}
