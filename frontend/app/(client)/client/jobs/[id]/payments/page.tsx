import ClientMomoPay from "@/components/payments/ClientMomoPay";

export default function JobPaymentsPage({ params }:{ params:{ id:string } }){
  const jobId = params.id;
  // If you store amounts on job, fetch it; for demo we pass a placeholder.
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Payment</h1>
      <ClientMomoPay jobId={jobId} defaultAmount={50000} defaultCurrency="RWF" />
    </div>
  );
}
