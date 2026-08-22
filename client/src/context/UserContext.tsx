import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Task } from "../types/task"; // Adjust path to your Task type
import type { Plan } from "../types/plan";

interface User {
  name: string;
  email: string;
}

interface UserContextType {

  emails: string[];
  plansTasks: Plan[];
  refreshEmails: () => Promise<void>;
  refreshUser: () => void;
  user: User | null;
  assignedTasks: Task[];
  unseenCount: number;
  fetchAssignedTasks: () => Promise<void>;
  markAssignedAsSeen: () => void;
  fetchPlans: () => void;
  loaders: boolean;
  setLoaders: React.Dispatch<React.SetStateAction<boolean>>;
}
const notificationSound = typeof window !== "undefined" ? new Audio("/notification.mp3") : null;


const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [emails, setEmails] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [plansTasks, setPlans] = useState<Plan[]>([])
  const [unseenCount, setUnseenCount] = useState<number>(0);
  const [loaders, setLoaders] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null)
  const lastSoundTimeRef = useRef<number>(0);

  const authUrl = import.meta.env.VITE_AUTH_URL;
  const taskUrl = import.meta.env.VITE_TASK_URL;

  // notification  section 
  const playNotificationSound = () => {
  if (!notificationSound) return;

  const now = Date.now();
  const COOLDOWN_MS = 2000; // Prevents sound spam within 2 seconds

  if (now - lastSoundTimeRef.current > COOLDOWN_MS) {
    lastSoundTimeRef.current = now;
    notificationSound.currentTime = 0;
    
    notificationSound.play().catch((err) => {
      // Quietly catches autoplay blocks if the user hasn't clicked the page yet
      console.warn("Notification audio waiting for user interaction.",err);
    });
  }
};




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

  // Keep React state in sync whenever the authenticated browser session changes.
  const refreshUser = () => {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      setUser(null);
      setAssignedTasks([]);
      setPlans([]);
      setUnseenCount(0);
      return;
    }

    try {
      const nextUser: User = JSON.parse(storedUser);

      if (user?.email !== nextUser.email) {
        setAssignedTasks([]);
        setPlans([]);
        setUnseenCount(0);
      }

      setUser(nextUser);
    } catch (error) {
      console.error("Failed to parse user session", error);
      localStorage.removeItem('user');
      setUser(null);
      setAssignedTasks([]);
      setPlans([]);
      setUnseenCount(0);
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
    refreshUser();
  }, []);

  // Fetch assigned tasks whenever user session is ready
  useEffect(() => {
    if (user?.email) {
      fetchAssignedTasks();
    }
  }, [user?.email]);



  // websocket connection
  // Add dedicated WS URL environment variable with fallback directly to task-service (port 8081)
  const taskWsUrl = import.meta.env.VITE_TASK_WS_URL || "ws://localhost:8081";

  useEffect(() => {
    if (!user?.email) return;

    let isMounted = true;
    let timerId: ReturnType<typeof setTimeout>;

    // 1. Construct WebSocket URL pointing directly to task-service host
    const cleanHost = taskWsUrl.replace(/^wss?:\/\//, "").replace(/^https?:\/\//, "");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${cleanHost}/ws?email=${encodeURIComponent(user.email)}`;

    



    const pingAndConnect = async () => {
      try {
        // Ping HTTP REST endpoint through Gateway/Task URL
        const res = await fetch(`${taskUrl}/tasks/ping`);

        if (res.ok && isMounted) {
          const ws = new WebSocket(wsUrl);
          socketRef.current = ws;

          let pingInterval: ReturnType<typeof setInterval>;

          ws.onopen = () => {
            // Send heartbeat every 25s to keep connection alive on Render/Cloud hosts
            pingInterval = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "PING" }));
              }
            }, 25000);
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === "TASK_ASSIGNED") {
                playNotificationSound();
              }
              if (
                data.type === "TASK_ASSIGNED" ||
                data.type === "TASK_DELETED" ||
                data.type === "TASK_UPDATED"
              ) {
                // 300ms delay gives Spring Boot @Transactional time to commit to Neon DB
                setTimeout(() => {
                  fetchAssignedTasks();
                  fetchPlans();
                }, 300);
              }
            } catch (err) {
              console.error("Error parsing WebSocket payload:", err);
            }
          };
          ws.onclose = () => {
            clearInterval(pingInterval);
            if (isMounted) {
              timerId = setTimeout(pingAndConnect, 3000);
            }
          };

          return;
        }
      } catch (e) {
        console.log("Server waking up, retrying ping in 3s...");
      }

      if (isMounted) {
        timerId = setTimeout(pingAndConnect, 3000);
      }
    };

    pingAndConnect();

    return () => {
      isMounted = false;
      clearTimeout(timerId);
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
      }
    };
  }, [user?.email]);


  return (
    <UserContext.Provider
      value={{
        emails,
        refreshUser,
        user,
        plansTasks,
        loaders,
        setLoaders,

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
