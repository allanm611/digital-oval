import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import {
  formatDocumentTitle,
  mergePageTask,
  resolvePageTask,
  type PageTask,
} from "./pageTask";

interface PageTaskRegistration {
  path: string;
  task: Partial<PageTask>;
}

interface PageTaskContextValue {
  register: (id: string, registration: PageTaskRegistration) => void;
  unregister: (id: string) => void;
}

const PageTaskContext = createContext<PageTaskContextValue | null>(null);

/**
 * Keeps `document.title` aligned with the open route, and with any richer
 * task a page registers through `usePageTask`.
 */
export function PageTaskProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [registrations, setRegistrations] = useState<
    Map<string, PageTaskRegistration>
  >(() => new Map());

  const api = useMemo<PageTaskContextValue>(
    () => ({
      register(id, registration) {
        setRegistrations((current) => {
          const existing = current.get(id);
          if (
            existing &&
            existing.path === registration.path &&
            existing.task.task === registration.task.task &&
            existing.task.subject === registration.task.subject &&
            existing.task.step === registration.task.step &&
            existing.task.status === registration.task.status
          ) {
            return current;
          }
          const next = new Map(current);
          next.set(id, registration);
          return next;
        });
      },
      unregister(id) {
        setRegistrations((current) => {
          if (!current.has(id)) return current;
          const next = new Map(current);
          next.delete(id);
          return next;
        });
      },
    }),
    [],
  );

  const title = useMemo(() => {
    const base = resolvePageTask(location.pathname, location.search);
    let override: Partial<PageTask> | undefined;
    registrations.forEach((registration) => {
      if (registration.path === location.pathname) {
        override = registration.task;
      }
    });
    return formatDocumentTitle(mergePageTask(base, override));
  }, [location.pathname, location.search, registrations]);

  useEffect(() => {
    if (document.title !== title) {
      document.title = title;
    }
  }, [title]);

  return (
    <PageTaskContext.Provider value={api}>{children}</PageTaskContext.Provider>
  );
}

/**
 * Publish the record name, wizard step, or status for the current page.
 * Pass `null` while this view should leave the route title unchanged
 * (for example an offer form opened as a modal inside another task).
 *
 * Keep subjects free of MSISDNs, emails, and other private identifiers.
 * Tab titles are visible in hover cards, window switchers, and screen share.
 */
export function usePageTask(task: Partial<PageTask> | null | undefined): void {
  const context = useContext(PageTaskContext);
  const location = useLocation();
  const id = useId();
  const taskLabel = task?.task;
  const subject = task?.subject;
  const step = task?.step;
  const status = task?.status;
  const enabled = task != null;

  useEffect(() => {
    if (!context || !enabled) return;
    context.register(id, {
      path: location.pathname,
      task: {
        task: taskLabel,
        subject,
        step,
        status,
      },
    });
    return () => context.unregister(id);
  }, [
    context,
    enabled,
    id,
    location.pathname,
    status,
    step,
    subject,
    taskLabel,
  ]);
}
