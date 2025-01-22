import { sig } from "@ncpa0cpl/vanilla-jsx/signals";
import { FStat } from "../filesystem-interface";
import { byID } from "../utils/dispatch-by-id";
import { Resolvable } from "../utils/immediate";

export type JobType = "copy" | "move";

export interface JobEntry {
  id: symbol;
  type: JobType;
  status: "queued" | "pending" | "complete";
  progress?: number;
  file: FStat;
}

export interface QueuedJob<R> {
  start: () => R;
  updateProgress: (progress: number) => void;
}

export class JobsController {
  private readonly jobs = sig<JobEntry[]>([]);

  public createJob<R extends Resolvable<any>>(
    type: JobType,
    file: FStat,
    perform: () => R,
  ): QueuedJob<R> {
    const job: JobEntry = {
      id: Symbol(),
      type,
      status: "queued",
      file,
    };
    this.jobs.dispatch(jobs => [...jobs, job]);
    return {
      start: () => {
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
        return promise;
      },
      updateProgress: (progress: number) => {
        this.jobs.dispatch(byID(job.id, job => {
          return { ...job, progress } as const;
        }));
      },
    };
  }

  public get() {
    return this.jobs.readonly();
  }
}
