import { JournalEntriesList } from "@/components/journal-entries";

export const metadata = {
  title: "Journal Entries | AccuBooks",
  description: "View posted journal entries.",
};

export default function JournalEntriesPage() {
  return <JournalEntriesList />;
}
