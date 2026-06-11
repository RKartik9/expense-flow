export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export function actionError(err: unknown): { success: false; error: string } {
  const message = err instanceof Error ? err.message : "Something went wrong";
  return { success: false, error: message };
}
