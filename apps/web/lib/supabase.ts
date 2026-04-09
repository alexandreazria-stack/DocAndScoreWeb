import { createClient } from "@supabase/supabase-js";
import type { Doctor, TestResult, StoredResult } from "@/lib/types";

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

export async function saveTestResult(result: TestResult): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("test_results").insert({
    doctor_id: user.id,
    test_id: result.test.id,
    test_acronym: result.test.acronym,
    test_name: result.test.name,
    test_icon: result.test.icon,
    total_score: result.totalScore,
    max_score: result.test.maxScore,
    scoring_label: result.scoring.label,
    scoring_color: result.scoring.color,
    scoring_severity: result.scoring.severity,
    session_code: result.sessionCode ?? null,
  });
}

export async function loadTestHistory(): Promise<StoredResult[]> {
  const { data, error } = await supabase
    .from("test_results")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    testId: r.test_id,
    testAcronym: r.test_acronym,
    testName: r.test_name,
    testIcon: r.test_icon,
    totalScore: r.total_score,
    maxScore: r.max_score,
    scoringLabel: r.scoring_label,
    scoringColor: r.scoring_color,
    scoringSeverity: r.scoring_severity,
    sessionCode: r.session_code,
    createdAt: r.created_at,
  }));
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
