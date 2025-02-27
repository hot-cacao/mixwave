import { Queue, FlowProducer, Job } from "bullmq";
import { randomUUID } from "crypto";
import { connection } from "./env";
import type { FlowChildJob } from "bullmq";
import type { Input, Stream } from "../types";
import type { TranscodeData } from "../consumer/workers/transcode";
import type { PackageData } from "../consumer/workers/package";
import type { FfmpegData } from "../consumer/workers/ffmpeg";

export const flowProducer = new FlowProducer({
  connection,
});

const transcodeQueue = new Queue<TranscodeData>("transcode", {
  connection,
});

const packageQueue = new Queue<PackageData>("package", {
  connection,
});

const ffmpegQueue = new Queue<FfmpegData>("ffmpeg", {
  connection,
});

/**
 * Export all available queues so we can read them elsewhere, such as in api
 * where we can build job stats for each queue.
 */
export const allQueus = [transcodeQueue, packageQueue, ffmpegQueue];

type AddTranscodeJobData = {
  assetId?: string;
  inputs: Input[];
  streams: Stream[];
  segmentSize?: number;
  packageAfter?: boolean;
  tag?: string;
};

/**
 * Add a transcode job to the queue.
 * When called multiple times with the same assetId, duplicate jobs will
 * be discarded.
 */
export async function addTranscodeJob({
  assetId = randomUUID(),
  inputs,
  streams,
  segmentSize = 4,
  packageAfter = false,
  tag,
}: AddTranscodeJobData) {
  const jobId = `transcode_${assetId}`;

  const pendingJob = await Job.fromId(transcodeQueue, jobId);
  if (pendingJob) {
    return pendingJob;
  }

  let childJobIndex = 0;
  const childJobs: FlowChildJob[] = [];

  for (const stream of streams) {
    let input: Input | undefined;

    if (stream.type === "video") {
      input = inputs.find((input) => input.type === "video");
    }

    if (stream.type === "audio") {
      input = inputs.find(
        (input) => input.type === "audio" && input.language === stream.language,
      );
    }

    if (stream.type === "text") {
      input = inputs.find(
        (input) => input.type === "text" && input.language === stream.language,
      );
    }

    if (input) {
      const params: string[] = [stream.type];
      if (stream.type === "video") {
        params.push(stream.height.toString());
      }
      if (stream.type === "audio" || stream.type === "text") {
        params.push(stream.language);
      }

      childJobs.push({
        name: `ffmpeg(${params.join(",")})`,
        data: {
          params: {
            input,
            stream,
            segmentSize,
            assetId,
          },
          metadata: {
            parentSortKey: ++childJobIndex,
          },
        } satisfies FfmpegData,
        queueName: "ffmpeg",
        opts: {
          jobId: `ffmpeg_${randomUUID()}`,
          failParentOnFailure: true,
        },
      });
    }
  }

  const { job } = await flowProducer.add({
    name: "transcode",
    queueName: "transcode",
    data: {
      params: {
        assetId,
        segmentSize,
        packageAfter,
      },
      metadata: {
        tag,
      },
    } satisfies TranscodeData,
    children: childJobs,
    opts: {
      jobId,
    },
  });

  return job;
}

type AddPackageJobData = {
  assetId: string;
  segmentSize?: number;
  name?: string;
  tag?: string;
};

/**
 * Add a package job to the queue.
 */
export async function addPackageJob({
  assetId,
  segmentSize,
  name = "hls",
  tag,
}: AddPackageJobData) {
  return await packageQueue.add(
    "package",
    {
      params: {
        assetId,
        segmentSize,
        name,
      },
      metadata: {
        tag,
      },
    } satisfies PackageData,
    {
      jobId: `package_${randomUUID()}`,
    },
  );
}
