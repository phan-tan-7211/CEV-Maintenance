-- Asset catalog administration requires explicit DELETE policies.
-- Foreign keys remain the source of truth for referential safety; the UI also
-- checks references first so users receive an actionable message instead of a
-- destructive cascade.

drop policy if exists authenticated_delete_asset_groups on public.asset_groups;
create policy authenticated_delete_asset_groups
  on public.asset_groups
  for delete
  to authenticated
  using (true);

drop policy if exists authenticated_delete_asset_types on public.asset_types;
create policy authenticated_delete_asset_types
  on public.asset_types
  for delete
  to authenticated
  using (true);
