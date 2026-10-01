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

import { useMemo } from "react";
import useFetchDocumentReferences from "@/hooks/useFetchDocumentReferences.ts";
import { nanoid } from "nanoid";
import dayjs from "dayjs";
import {
  createDocumentReferenceTableColumns,
  DocumentReferenceTableData,
} from "@/utils/patientDetails.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import SimpleTable from "@/components/SimpleTable.tsx";

interface PatientDocumentReferencesProps {
  patientId: string;
}

function PatientDocumentReferences(props: PatientDocumentReferencesProps) {
  const { patientId } = props;

  const { documentReferences, queryUrl, isInitialLoading } =
    useFetchDocumentReferences(patientId);

  const documentReferenceTableData: DocumentReferenceTableData[] =
    useMemo(() => {
      return documentReferences.map((entry) => {
        return {
          id: entry.id ?? nanoid(),
          document:
            entry.type?.coding?.[0]?.display ??
            entry.type?.text ??
            entry.type?.coding?.[0]?.code ??
            "*",
          description: entry.description ?? "",
          status: entry.status ?? "",
          category:
            entry.category?.[0]?.coding?.[0]?.display ??
            entry.category?.[0]?.text ??
            entry.category?.[0]?.coding?.[0]?.code ??
            "",
          date: entry.date ? dayjs(entry.date) : null,
          attachments: (entry.content ?? []).map((content) => ({
            url: content.attachment?.url ?? "",
            title: content.attachment?.title ?? "",
            contentType: content.attachment?.contentType ?? "",
          })),
        };
      });
    }, [documentReferences]);

  const columns = createDocumentReferenceTableColumns();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document References</CardTitle>
        <CardDescription>
          Patient's documents, with links to their attachments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SimpleTable
          data={documentReferenceTableData}
          columns={columns}
          queryUrl={queryUrl}
          isLoading={isInitialLoading}
          initialSorting={[{ id: "date", desc: true }]}
        />
      </CardContent>
    </Card>
  );
}

export default PatientDocumentReferences;
