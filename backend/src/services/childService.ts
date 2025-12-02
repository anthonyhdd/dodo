import { Child } from '../models/types';
import { supabase } from '../lib/supabase';

export async function getChildren(): Promise<Child[]> {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch children: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    ageMonths: row.age_months,
    createdAt: row.created_at,
  }));
}

export async function createChild(name: string, ageMonths?: number): Promise<Child> {
  const { data, error } = await supabase
    .from('children')
    .insert({
      name,
      age_months: ageMonths ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create child: ${error.message}`);
  }

  return {
    id: data.id,
    name: data.name,
    ageMonths: data.age_months,
    createdAt: data.created_at,
  };
}
