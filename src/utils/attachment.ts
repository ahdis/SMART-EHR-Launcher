/*
 * Copyright 2025 Commonwealth Scientific and Industrial Research
 * Organisation (CSIRO) ABN 41 687 119 230.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Resolve an Attachment.url to an absolute http(s) URL.
 * Relative references (e.g. Binary/123 or Bundle/456) are resolved against the FHIR server base URL.
 * Returns null if the URL cannot be opened in a browser (e.g. urn:uuid: or other schemes).
 */
export function resolveAttachmentUrl(
  url: string,
  fhirServerUrl: string
): string | null {
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(url);
  if (hasScheme) {
    return /^https?:\/\//i.test(url) ? url : null;
  }

  if (!fhirServerUrl) {
    return null;
  }

  return fhirServerUrl.replace(/\/+$/, "") + "/" + url.replace(/^\/+/, "");
}

/**
 * Blob URLs share the origin of this app, so content which could run scripts (HTML, SVG, XML) is shown as plain text.
 * FHIR JSON is relabelled as plain JSON so that the browser displays it instead of downloading it.
 */
export function getDisplayableBlob(blob: Blob): Blob {
  const type = blob.type.toLowerCase();

  if (type.includes("json")) {
    return new Blob([blob], { type: "application/json" });
  }

  if (type.startsWith("text/") || type.includes("xml")) {
    return new Blob([blob], { type: "text/plain" });
  }

  return blob;
}
