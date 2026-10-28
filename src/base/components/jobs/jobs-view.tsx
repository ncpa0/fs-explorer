import { Box, Typography } from "adwavecss";
import { Explorer } from "../../../explorer";
import { JobType } from "../../jobs-controller";

const JOB_TYPE_LABELS: Record<JobType, string> = {
  copy: "Copying",
  move: "Moving",
  custom: "",
};

export function JobsView({ explorer }: { explorer: Explorer }) {
  const { jobs } = explorer;

  return (
    <div>
      {jobs.get().derive(allJobs => {
        if (allJobs.length === 0) return;

        const grouped = Object.groupBy(allJobs, j =>
          j.label ?? JOB_TYPE_LABELS[j.type]);

        return (
          <>
            {Object.entries(grouped).map(([label, jobs]) => {
              if (!jobs) return <span />;

              const firstIncomplete = jobs.find(j =>
                j.status === "pending"
              );

              const completedJobsCount = jobs.filter(j =>
                j.status === "complete"
              ).length;

              const progressWidth = `${
                (100 * completedJobsCount / jobs.length).toFixed(2)
              }%`;

              return (
                <div
                  class={{ "jobs-view": true }}
                >
                  <div
                    class={[
                      Box.className({ bg: 5, rounded: true }),
                      "view-card",
                    ]}
                  >
                    <span class="job-title">
                      <span>
                        {label}:{" "}
                      </span>
                      <span class={[Typography.subtitle, "filename"]}>
                        {firstIncomplete?.file.name ?? ""}
                      </span>
                    </span>
                    <span
                      class="job-progress"
                      style={{ width: progressWidth }}
                    />
                  </div>
                </div>
              );
            })}
          </>
        );
      })}
    </div>
  );
}
