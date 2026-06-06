

# Fix: Patient email not showing when editing

## Problem
When editing a patient, the email field shows "Sem e-mail cadastrado" because the query to the `profiles` table is blocked by RLS. The current policy only allows `auth.uid() = id`, so clinic staff cannot read patient profiles.

## Root Cause
The `profiles` table SELECT policy (`Users can view own profile`) restricts reads to `auth.uid() = id`. When the clinic owner queries a patient's profile to get their email, RLS returns nothing.

## Fix

### Step 1 -- Add RLS policy on `profiles`
Add a new SELECT policy that allows clinic staff to view profiles of users belonging to their clinic:

```sql
CREATE POLICY "Clinic staff can view related profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT c.user_id FROM cadastros c
    WHERE c.user_id IS NOT NULL
      AND c.clinica_id IN (SELECT get_user_clinica_ids(auth.uid()))
  )
);
```

This lets clinic owners/staff/doctors read the `profiles` row of any user who has a `cadastros` entry in their clinic.

### Step 2 -- No code changes needed
The `PatientFormDialog` already queries `profiles` correctly (line 71-78). Once RLS allows the read, the email will appear.

