import { createClient } from "@supabase/supabase-js";
import type { Doctor } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function loadProfile(): Promise<Doctor | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("title, first_name, last_name, specialty")
    .eq("id", user.id)
    .single();
  if (!data) return null;
  return { title: data.title, firstName: data.first_name, lastName: data.last_name, specialty: data.specialty };
}

export async function saveProfile(doctor: Doctor): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").upsert({
    id: user.id,
    title: doctor.title,
    first_name: doctor.firstName,
    last_name: doctor.lastName,
    specialty: doctor.specialty,
  });
}
