import { Box, Card, Typography } from "adwavecss";
import { Explorer } from "../../../explorer";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function JobsView({ explorer }: { explorer: Explorer }) {
  const { jobs } = explorer;

  const topJob = jobs.get().derive(jobs => {
    return jobs.find(j => j.status !== "complete") || jobs.at(-1);
  });

  return (
    <div
      class={{
        "jobs-view": true,
        hide: jobs.get().derive(j => j.length === 0),
      }}
    >
      <div class={[Box.className({ bg: 5, rounded: true }), "view-card"]}>
        {topJob.derive(topJob => {
          if (!topJob) {
            return;
          }
          return (
            <span class="job-title">
              <span>
                {topJob.type === "copy" ? "Copying" : "Moving"} file:{" "}
              </span>
              <span class={[Typography.subtitle, "filename"]}>
                {topJob.file.name}
              </span>
            </span>
          );
        })}
        <span
          class="job-progress"
          style={{
            width: jobs.get().derive(jobs => {
              const completedJobsCount = jobs.filter(j =>
                j.status === "complete"
              ).length;
              return `${(100 * completedJobsCount / jobs.length).toFixed(2)}%`;
            }),
          }}
        />
      </div>
    </div>
  );
}
