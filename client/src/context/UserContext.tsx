import { createContext, useContext, useEffect, useState } from "react";
import type { Task } from "../types/task"; // Adjust path to your Task type
import type { Plan } from "../types/plan";

interface User {
  name: string;
  email: string;
}

interface UserContextType {
  
  emails: string[];
  plansTasks:Plan[];
  refreshEmails: () => Promise<void>;
  user: User | null;
  assignedTasks: Task[];
  unseenCount: number;
  fetchAssignedTasks: () => Promise<void>;
  markAssignedAsSeen: () => void;
  fetchPlans : ()=> void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [emails, setEmails] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [plansTasks,setPlans] = useState<Plan[]>([]) 
  const [unseenCount, setUnseenCount] = useState<number>(0);

  const authUrl = import.meta.env.VITE_AUTH_URL;
  const taskUrl = import.meta.env.VITE_TASK_URL;

  // 1. Fetch system emails
  const fetchEmails = async () => {
    try {
      const res = await fetch(`${authUrl}/auth/emails`);
      if (!res.ok) throw new Error("Failed to fetch emails");
      const data: string[] = await res.json();
      setEmails(data);
    } catch (error) {
      console.error("Error fetching user emails:", error);
      setEmails([]);
    }
  };

  // 2. Fetch logged-in user from localStorage
  const fetchUser = () => {
    const res = localStorage.getItem('user');
    if (res) {
      try {
        setUser(JSON.parse(res));
      } catch (e) {
        console.error("Failed to parse user session", e);
      }
    }
  };

  // 3. Fetch Assigned Tasks & Calculate Unseen Count
  const fetchAssignedTasks = async () => {
    if (!user?.email) return;

    try {
      const res = await fetch(
        `${taskUrl}/tasks?assignedEmail=${encodeURIComponent(user.email)}`
      );
      const resBody = await res.json();

      if (res.ok) {
        const tasks: Task[] = resBody;
        setAssignedTasks(tasks);

        // Get previously saved "seen" task IDs from localStorage
        const savedSeenIdsRaw = localStorage.getItem(`seen_tasks_${user.email}`);
        const seenTaskIds: number[] = savedSeenIdsRaw ? JSON.parse(savedSeenIdsRaw) : [];

        // Count how many fetched tasks are NOT in the seen list
        const unseen = tasks.filter((t) => !seenTaskIds.includes(t.id));
        setUnseenCount(unseen.length);
      } else {
        console.error(resBody.error || "Failed to fetch task");
      }
    } catch (error) {
      console.error("Error fetching assigned tasks:", error);
    }
  };

  const fetchPlans = async () => {
  if (!user?.email) return;
  try {
    const res = await fetch(
      `${taskUrl}/plans?ownerEmail=${encodeURIComponent(user.email)}`
    );
    const resBody = await res.json();
    if (!res.ok) throw new Error(resBody.error || "Failed to fetch plans");
    
    // Spring returns List<Plan> directly, so set resBody directly
    setPlans(resBody);
  } catch (error) {
    console.error("Error fetching plans:", error);
  }
};



  // 4. Mark all assigned tasks as "seen" (called when user opens /assigned page)
  const markAssignedAsSeen = () => {
    if (!user?.email || assignedTasks.length === 0) return;

    // Save all current assigned task IDs to localStorage
    const currentTaskIds = assignedTasks.map((t) => t.id);
    localStorage.setItem(`seen_tasks_${user.email}`, JSON.stringify(currentTaskIds));

    // Instantly reset unseen count to 0
    setUnseenCount(0);
  };

  useEffect(() => {
    fetchEmails();
    fetchUser();
    fetchPlans(); // <--- ADD THIS HERE
  }, []);

  // Fetch assigned tasks whenever user session is ready
  useEffect(() => {
    if (user?.email) {
      fetchAssignedTasks();
    }
  }, [user?.email]);

  return (
    <UserContext.Provider
      value={{
        emails,
        user,
        plansTasks,
        
        assignedTasks,
        unseenCount,
        refreshEmails: fetchEmails,
        fetchAssignedTasks,
        markAssignedAsSeen,
        fetchPlans
       
        
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUsers must be used inside UserProvider");
  }
  return context;
}