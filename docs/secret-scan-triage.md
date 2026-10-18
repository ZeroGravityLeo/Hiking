# Historical secret scan triage

A localStorage record name, not a credential.

Only the exact historical fingerprints in `.gitleaksignore` are excluded. No whole files, paths or rules are disabled. The scanner continues to traverse the full history including merge parents.

Public client keys do not establish that database permissions are safe; RLS and grants were not audited by this classification. See [Supabase key types](https://supabase.com/docs/guides/getting-started/api-keys).
