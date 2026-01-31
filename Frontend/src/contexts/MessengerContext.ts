import { createContext } from 'react';
import type { MessengerContextType } from '../types/messenger';

export const MessengerContext = createContext<MessengerContextType | null>(null);