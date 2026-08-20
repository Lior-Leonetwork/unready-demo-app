// client-side checkout helper
const stripeKey = import.meta.env.VITE_STRIPE_SECRET_KEY;
const supabase = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export async function checkout(items) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": stripeKey },
    body: JSON.stringify({ items }),
  });
  return res.json();
}
