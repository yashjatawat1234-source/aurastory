export const createServerFn = () => ({
  handler: (fn: any) => fn,
  validator: () => ({ handler: (fn: any) => fn }),
});

export const useServerFn = (fn: any) => fn;