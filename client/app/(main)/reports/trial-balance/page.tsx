import TrialBalanceReport from "@/components/reports/trial-balance";

export const metadata = {
  title: "Trial Balance | AccuBooks",
  description: "Review debit and credit balances for your accounts.",
};

export default function TrialBalancePage() {
  return <TrialBalanceReport />;
}
