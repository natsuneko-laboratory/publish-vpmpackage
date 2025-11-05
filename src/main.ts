import { error, getIDToken, info, setFailed } from "@actions/core";
import { getAudience, getPackagesInput, getRetries } from "./input";
import {
  errorMessage,
  withRetries,
} from "@google-github-actions/actions-utils/dist";
import { exportOutput, getManifest } from "./utils";
import { readFileSync } from "node:fs";

async function exchangeToken(): Promise<string> {
  const audience = getAudience();
  const token = getIDToken(audience);

  const exchangeRes = await fetch("https://api.natsuneko.com/token/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: token }),
  });

  if (!exchangeRes.ok) {
    throw new Error(`token exchange failed with status ${exchangeRes.status}`);
  }

  // output token
  const data = await exchangeRes.json();
  exportOutput(data.token);

  return data.token;
}

async function waitForFinalize(
  token: string,
  url: string,
  pkg: string
): Promise<void> {
  const manifest = await getManifest(pkg);
  const name = manifest.name;
  const version = manifest.version;
  const stat = `https://remuria.natsuneko.com/api/v1/package/status?name=${encodeURIComponent(
    name
  )}&version=${encodeURIComponent(version)}`;
  let counter = 0;

  return new Promise((resolve, reject) => {
    setInterval(async () => {
      try {
        const res = await fetch(stat, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const ret = await fetch(
            "https://remuria.natsuneko.com/api/v1/package/finalize",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ name, url }),
            }
          );

          if (ret.ok) {
            return resolve();
          }
        }
      } catch (e) {
        // @ts-ignore
        error(e);
      }

      counter++;

      if (counter >= 12) {
        return reject(
          new Error(`package ${pkg} finalize timed out after 1 minute`)
        );
      }
    }, 5000);
  });
}

async function publishPackage(
  pkg: string,
  token: string
): Promise<string | undefined> {
  const res = await fetch(
    "https://remuria.natsuneko.com/api/v1/package/publish",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    return `package ${pkg} publish failed with status ${res.status}`;
  }

  const data = await res.json();
  const { url, signedUrl } = data;
  const file = readFileSync(pkg);

  const ret = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });

  if (!ret.ok) {
    return `package ${pkg} upload failed with status ${ret.status}`;
  }

  await waitForFinalize(token, url, pkg);
  info(`package ${pkg} published to: ${url}`);
  return;
}

async function main() {
  const token = await exchangeToken();
  const packages = getPackagesInput();

  const errors: string[] = [];
  // publish packages
  for (const pkg of packages) {
    const ret = await publishPackage(pkg, token);
    if (ret) {
      errors.push(ret);
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}

async function run() {
  const retries = Number(getRetries());

  try {
    await withRetries(main, {
      retries,
      backoff: 300,
    });
  } catch (e) {
    const msg = errorMessage(e);

    // @ts-ignore
    error(e);
    setFailed(`@natsuneko-laboratory/publish-vpmpackage failed with ${msg}`);
  }
}

run();
