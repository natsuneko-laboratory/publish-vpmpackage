import { exportVariable, setSecret } from "@actions/core";
import JSZip from "jszip";
import { readFileSync } from "node:fs";

interface Manifest {
  name: string;
  version: string;
}

export function exportOutput(token: string) {
  setSecret(token);
  exportVariable("REMURIA_ID_TOKEN", token);
}

export async function getManifest(path: string): Promise<Manifest> {
  const zip = new JSZip();
  const buffer = readFileSync(path);
  const content = await zip.loadAsync(buffer);
  const entry = content.file("package.json");
  const text = await entry!.async("string");
  return JSON.parse(text);
}
