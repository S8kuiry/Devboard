import { createContext, useContext, useEffect, useState } from "react";

interface UserContextType {
  emails: string[];
  refreshEmails: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [emails, setEmails] = useState<string[]>([]);

  const authUrl = import.meta.env.VITE_AUTH_URL;

  const fetchEmails = async () => {
    try {

      const res = await fetch(`${authUrl}/auth/emails`);

      if (!res.ok) {
        throw new Error("Failed to fetch emails");
      }

      const data: string[] = await res.json();

      setEmails(data);
    } catch (error) {
      console.error("Error fetching user emails:", error);
      setEmails([]);
    } finally {
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  return (
    <UserContext.Provider
      value={{
        emails,
        refreshEmails: fetchEmails,
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