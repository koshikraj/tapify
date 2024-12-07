const SUPABASE_URL = 'https://dlcuwortfaehxqekexev.supabase.co';


export async function getVoucherData() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/vouchers`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_KEY!,
      },
    });
    const data = await response.json();
    return data;
  }


  export async function getVoucherDataById(id: string) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/vouchers?voucher_id=eq.${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_KEY!,
      },
    });
    const data = await response.json();
    return data;
  }


  export async function addVoucherData(voucher_id: string, encrypted_metadata: string, status: string) {
     await fetch(`${SUPABASE_URL}/rest/v1/vouchers`, {
     method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_KEY!,
      },
      body: JSON.stringify({ voucher_id, encrypted_metadata, status}),
    });
  }


  export async function updateVoucherData(voucher_id: string, encrypted_metadata: string, status: string, details: {}) {
    await fetch(`${SUPABASE_URL}/rest/v1/vouchers?voucher_id=eq.${voucher_id}`, {
    method: 'PATCH',
     headers: {
       'Content-Type': 'application/json',
       'apikey': process.env.NEXT_PUBLIC_SUPABASE_KEY!,
     },
     body: JSON.stringify({ encrypted_metadata, status, details}),
   });
 }