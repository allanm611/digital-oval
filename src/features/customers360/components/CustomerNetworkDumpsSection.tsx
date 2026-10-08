import DateFormatter from "../../../shared/components/DateFormatter";
import { tw } from "../../../shared/utils/utils";
import type { CustomerDumpFeed } from "../types/customerAccountDevice";

type CustomerNetworkDumpsSectionProps = {
  hlr: CustomerDumpFeed;
  vlr: CustomerDumpFeed;
  isLoading: boolean;
};

function looksLikeTimestamp(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value));
}

function DumpCard({
  title,
  description,
  feed,
  isLoading,
  emptyHint,
}: {
  title: string;
  description: string;
  feed: CustomerDumpFeed;
  isLoading: boolean;
  emptyHint: string;
}) {
  const received = feed.available;
  return (
    <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h5 className="text-sm font-semibold text-gray-900">{title}</h5>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            isLoading
              ? "bg-gray-100 text-gray-500"
              : received
                ? "bg-green-50 text-green-800"
                : "bg-gray-100 text-gray-600"
          }`}
        >
          {isLoading ? "Checking" : received ? "Received" : "Not received"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 mb-4">
        <div>
          <p className="text-xs uppercase text-gray-500 mb-1">Received</p>
          <p className="text-sm font-medium text-gray-900">
            {isLoading ? (
              "—"
            ) : feed.receivedAt ? (
              <DateFormatter date={feed.receivedAt} includeTime useUserTimezone />
            ) : received ? (
              "Received"
            ) : (
              "—"
            )}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500 mb-1">Records reported</p>
          <p className="text-sm font-medium text-gray-900">
            {isLoading
              ? "—"
              : feed.recordCount == null
                ? "—"
                : feed.recordCount.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500 mb-1">Dump id</p>
          <p className="text-sm font-medium text-gray-900 break-all">
            {isLoading ? "—" : feed.dumpId || "—"}
          </p>
        </div>
      </div>

      {isLoading ? null : !received ? (
        <p className="text-sm text-gray-500">{emptyHint}</p>
      ) : feed.fields.length === 0 ? (
        <p className="text-sm text-gray-500">
          The dump was received and did not include subscriber attributes.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {feed.fields.map((field) => (
            <div key={`${field.label}-${field.value}`}>
              <p className="text-xs uppercase text-gray-500 mb-1">{field.label}</p>
              <p className="text-sm text-gray-900 break-words">
                {looksLikeTimestamp(field.value) ? (
                  <DateFormatter
                    date={field.value}
                    includeTime
                    useUserTimezone
                  />
                ) : (
                  field.value
                )}
              </p>
            </div>
          ))}
        </div>
      )}

      {!isLoading && feed.truncated && (
        <p className="mt-3 text-xs text-amber-800">
          This card is the subscriber slice. The dump reported more records
          than were loaded here, and the full extract stays on the dump
          pipeline.
        </p>
      )}
      {!isLoading && feed.omittedFieldCount > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {feed.omittedFieldCount.toLocaleString()} more attribute
          {feed.omittedFieldCount === 1 ? "" : "s"} were left off this card
          so a wide dump row does not take over the profile.
        </p>
      )}
    </div>
  );
}

export default function CustomerNetworkDumpsSection({
  hlr,
  vlr,
  isLoading,
}: CustomerNetworkDumpsSectionProps) {
  return (
    <div className="mt-8">
      <h4 className="text-base font-semibold text-gray-900 mb-1">
        Network dumps
      </h4>
      <p className="text-sm text-gray-500 mb-4">
        HLR is the home register, the line&apos;s permanent network profile.
        VLR is the visitor register, where the line is attached in that
        extract.
      </p>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <DumpCard
          title="HLR dump"
          description="Home location register. Identity, status, and services when the extract includes them."
          feed={hlr}
          isLoading={isLoading}
          emptyHint="No HLR dump has been received for this customer."
        />
        <DumpCard
          title="VLR dump"
          description="Visitor location register. Current attachment, cell, and the location captured in the dump."
          feed={vlr}
          isLoading={isLoading}
          emptyHint="No VLR dump has been received for this customer."
        />
      </div>
    </div>
  );
}
