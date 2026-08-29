// src/context/TaskModalContext.tsx

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Task } from '../types/task';

interface TaskModalContextType {
  isOpen: boolean;
  initialTask: Task | null;
  openModal: (task?: Task | null) => void;
  closeModal: () => void;
  clearDraft: () => void;
}

const STORAGE_KEY_OPEN = 'task_modal_is_open';
const STORAGE_KEY_TASK = 'task_modal_initial_task';

const TaskModalContext = createContext<TaskModalContextType | undefined>(undefined);

export const TaskModalProvider = ({ children }: { children: ReactNode }) => {
  // Read open state from localStorage on load to survive page refresh
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    const savedState = localStorage.getItem(STORAGE_KEY_OPEN);
    return savedState ? JSON.parse(savedState) : false;
  });

  // Read initial/editing task from localStorage on load
  const [initialTask, setInitialTask] = useState<Task | null>(() => {
    const savedTask = localStorage.getItem(STORAGE_KEY_TASK);
    return savedTask ? JSON.parse(savedTask) : null;
  });

  // Persist modal state changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_OPEN, JSON.stringify(isOpen));
  }, [isOpen]);

  // Persist task data changes to localStorage
  useEffect(() => {
    if (initialTask) {
      localStorage.setItem(STORAGE_KEY_TASK, JSON.stringify(initialTask));
    } else {
      localStorage.removeItem(STORAGE_KEY_TASK);
    }
  }, [initialTask]);

  const openModal = (task: Task | null = null) => {
    setInitialTask(task);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setInitialTask(null);
    localStorage.removeItem(STORAGE_KEY_OPEN);
    localStorage.removeItem(STORAGE_KEY_TASK);
  };

  const clearDraft = () => {
    setInitialTask(null);
    localStorage.removeItem(STORAGE_KEY_TASK);
  };

  return (
    <TaskModalContext.Provider
      value={{
        isOpen,
        initialTask,
        openModal,
        closeModal,
        clearDraft,
      }}
    >
      {children}
    </TaskModalContext.Provider>
  );
};

export const useTaskModal = (): TaskModalContextType => {
  const context = useContext(TaskModalContext);
  if (!context) {
    throw new Error('useTaskModal must be used within a TaskModalProvider');
  }
  return context;
};