import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
import { documentsRouter } from '@/features/documents/server/router';
 
export const appRouter = createTRPCRouter({
  documents: documentsRouter
});
 
// export type definition of API
export type AppRouter = typeof appRouter;