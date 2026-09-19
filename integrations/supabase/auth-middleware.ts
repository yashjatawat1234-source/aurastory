export const requireSupabaseAuth = (req: any, res: any, next?: any) => {
  // Local development mock middleware
  if (next) next();
};