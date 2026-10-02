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

import { useContext, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { CircleMinus } from "lucide-react";
import { FhirServerContext } from "@/contexts/FhirServerContext.tsx";
import useFhirServerAxios from "@/hooks/useFhirServerAxios.ts";
import { getAttachmentResourcePath } from "@/utils/attachment.ts";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";

interface DocumentReferenceDeleteButtonProps {
  documentReferenceId: string;
  attachmentUrls: string[];
}

function DocumentReferenceDeleteButton(
  props: DocumentReferenceDeleteButtonProps
) {
  const { documentReferenceId, attachmentUrls } = props;

  const { baseUrl } = useContext(FhirServerContext);
  const axiosInstance = useFhirServerAxios();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Only attachments stored on this FHIR server are deleted, external URLs are left alone
  const attachmentPaths = [
    ...new Set(
      attachmentUrls
        .map((url) => getAttachmentResourcePath(url, baseUrl))
        .filter((path): path is string => path !== null)
    ),
  ];

  async function handleDelete() {
    setIsDeleting(true);

    try {
      await axiosInstance.delete(`/DocumentReference/${documentReferenceId}`);
    } catch (error) {
      console.error(error);
      enqueueSnackbar(
        `Failed to delete DocumentReference/${documentReferenceId}`,
        { variant: "error" }
      );
      setIsDeleting(false);
      return;
    }

    const failedPaths: string[] = [];
    for (const path of attachmentPaths) {
      try {
        await axiosInstance.delete(`/${path}`);
      } catch (error) {
        console.error(error);
        failedPaths.push(path);
      }
    }

    if (failedPaths.length > 0) {
      enqueueSnackbar(
        `DocumentReference/${documentReferenceId} deleted, but failed to delete ${failedPaths.join(", ")}`,
        { variant: "warning" }
      );
    } else {
      enqueueSnackbar(`DocumentReference/${documentReferenceId} deleted`, {
        variant: "success",
      });
    }

    setIsDeleting(false);
    setDialogOpen(false);
    await queryClient.invalidateQueries({
      predicate: (query) =>
        typeof query.queryKey[0] === "string" &&
        query.queryKey[0].startsWith("documentReferences"),
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-red-600"
        title="Delete document reference"
        aria-label="Delete document reference"
        onClick={() => setDialogOpen(true)}
      >
        <CircleMinus className="h-4 w-4" />
      </Button>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setDialogOpen(open);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document reference?</DialogTitle>
            <DialogDescription>
              This permanently deletes the following from the FHIR server:
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc pl-5 text-sm break-all">
            <li>DocumentReference/{documentReferenceId}</li>
            {attachmentPaths.map((path) => (
              <li key={path}>{path}</li>
            ))}
          </ul>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DocumentReferenceDeleteButton;
