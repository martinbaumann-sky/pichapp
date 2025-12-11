import { getSupabaseServiceClient } from "../supabase-clients";

type PreapprovalInput = {
  venueId: string;
  planId: string;
  returnUrl: string;
  payerEmail?: string | null;
};

export async function createPreapproval(input: PreapprovalInput) {
  const client = getSupabaseServiceClient();
  const { data, error } = await client
    .from("mp_preapprovals")
    .insert({
      venue_id: input.venueId,
      plan_id: input.planId,
      return_url: input.returnUrl,
      payer_email: input.payerEmail ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return { id: data.id ?? data.plan_id, init_point: input.returnUrl };
}

export async function cancelPreapproval(preapprovalId: string) {
  const client = getSupabaseServiceClient();
  await client.from("mp_preapprovals").update({ status: "cancelled" }).eq("id", preapprovalId);
  return { id: preapprovalId, status: "cancelled" };
}
