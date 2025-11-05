import { getInput, getMultilineInput } from "@actions/core";

export function getAudience(): string {
  return getInput("audience", { required: false });
}

export function getPackagesInput(): string[] {
  return getMultilineInput("packages", { required: true });
}

export function getRetries(): string {
  return getInput("retries", { required: false }) || "3";
}
