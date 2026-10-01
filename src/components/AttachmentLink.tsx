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

import { MouseEvent, useContext } from "react";
import { useSnackbar } from "notistack";
import { FhirServerContext } from "@/contexts/FhirServerContext.tsx";
import useFhirServerAxios from "@/hooks/useFhirServerAxios.ts";
import {
  getDisplayableBlob,
  resolveAttachmentUrl,
} from "@/utils/attachment.ts";

interface AttachmentLinkProps {
  url: string;
  contentType?: string;
}

function AttachmentLink(props: AttachmentLinkProps) {
  const { url, contentType } = props;

  const { baseUrl, accessToken } = useContext(FhirServerContext);
  const axiosInstance = useFhirServerAxios();
  const { enqueueSnackbar } = useSnackbar();

  const resolvedUrl = resolveAttachmentUrl(url, baseUrl);
  if (!resolvedUrl) {
    return <span className="break-all">{url}</span>;
  }

  // A plain link cannot carry the access token, so attachments on a secured FHIR server are fetched and opened as a blob
  const fetchWithToken = accessToken !== "" && resolvedUrl.startsWith(baseUrl);

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!fetchWithToken || !resolvedUrl) {
      return;
    }

    event.preventDefault();

    // Open the tab before the request, otherwise it is blocked as a popup
    const newTab = window.open("", "_blank");
    if (newTab) {
      newTab.opener = null;
    }

    try {
      const { data } = await axiosInstance.get<Blob>(resolvedUrl, {
        responseType: "blob",
        headers: { Accept: contentType ?? "*/*" },
      });

      const objectUrl = URL.createObjectURL(getDisplayableBlob(data));
      if (newTab) {
        newTab.location.href = objectUrl;
      }
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch (error) {
      console.error(error);
      newTab?.close();
      enqueueSnackbar(`Failed to load attachment from ${resolvedUrl}`, {
        variant: "error",
      });
    }
  }

  return (
    <a
      href={resolvedUrl}
      title={resolvedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="underline break-all"
      onClick={handleClick}
    >
      {url}
    </a>
  );
}

export default AttachmentLink;
