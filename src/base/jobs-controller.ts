import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { Queue } from "async-await-queue";
import { FStat } from "../filesystem-interface";
import { byID } from "../utils/dispatch-by-id";
import { Resolvable } from "../utils/immediate";

export type JobType = "copy" | "move" | "custom";

export interface JobEntry {
  id: symbol;
  type: JobType;
  label?: string;
  status: "queued" | "pending" | "complete";
  progress?: number;
  file: FStat;
}

export interface QueuedJob<R> {
  start: () => Promise<Awaited<R>>;
  updateProgress: (progress: number) => void;
}

export class JobsController {
  private readonly jobs = sig<JobEntry[]>([]);
  private readonly queue;

  constructor(maxParallel = 4) {
    this.queue = new Queue(maxParallel, 0);
  }

  public createJob<R extends Resolvable<any>>(
    type: JobType,
    file: FStat,
    perform: () => R,
    customJobOptions?: {
      label: string;
    },
  ): QueuedJob<R> {
    const job: JobEntry = {
      id: Symbol(),
      type,
      status: "queued",
      file,
    };

    if (type === "custom") {
      job.label = customJobOptions?.label;
    }

    this.jobs.dispatch(jobs => [...jobs, job]);
    return {
      start: () => {
        return this.queue.run(() => {
          this.jobs.dispatch(byID(job.id, job => {
            return { ...job, status: "pending" } as const;
          }));
          const promise = perform();
          promise.finally(() => {
            this.jobs.dispatch(byID(job.id, job => {
              return { ...job, status: "complete" } as const;
            }));
            setTimeout(() => {
              if (this.jobs.get().every(j => j.status === "complete")) {
                this.jobs.dispatch([]);
              }
            }, 750);
          });
          return promise as any;
        });
      },
      updateProgress: (progress: number) => {
        this.jobs.dispatch(byID(job.id, job => {
          return { ...job, progress } as const;
        }));
      },
    };
  }

  startAndWait<R>(jobs: QueuedJob<R>[]) {
    return Promise.all(jobs.map(j => j.start()));
  }

  public get() {
    return this.jobs.readonly();
  }
}
