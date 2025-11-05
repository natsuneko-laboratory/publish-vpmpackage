import { exportVariable, setSecret } from "@actions/core";

export function exportOutput(token: string) {
  setSecret(token);
  exportVariable("REMURIA_ID_TOKEN", token);
}
