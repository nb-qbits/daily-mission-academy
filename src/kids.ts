import type { Kid } from './types';

export const KIDS: Record<'iraj' | 'aveer', Kid> = {
  iraj: {
    id: 'iraj',
    name: 'Iraj',
    gradeLevel: 5,
    gradeLabel: 'Rising 5th Grade',
    focusAreas: ['Math: mean / median / mode', 'Force & motion science', 'Paragraph writing'],
    themeLabel: 'Data Detective + Force Explorer',
    icon: '🚀',
    pathLabel: 'Mission Control',
  },
  aveer: {
    id: 'aveer',
    name: 'Aveer',
    gradeLevel: 2,
    gradeLabel: 'Rising 2nd Grade',
    focusAreas: ['Reading & phonics', 'Addition & subtraction within 20', 'Sentence writing'],
    themeLabel: 'Reading Ranger + Math Explorer',
    icon: '🧭',
    pathLabel: 'Adventure Path',
  },
};

export const KID_LIST: Kid[] = [KIDS.iraj, KIDS.aveer];
