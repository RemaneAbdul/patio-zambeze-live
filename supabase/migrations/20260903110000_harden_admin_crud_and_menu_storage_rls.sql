-- Harden Supabase authorization for the existing Patio Zambeze schema.
-- No tables or data are dropped.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = true, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='menu_categories' and policyname='menu_categories_public_select') then
    create policy menu_categories_public_select on public.menu_categories for select to anon, authenticated using ("status" = 'ACTIVE');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='menu_categories' and policyname='menu_categories_admin_manage') then
    create policy menu_categories_admin_manage on public.menu_categories for all to authenticated using (get_current_user_role() = 'admin') with check (get_current_user_role() = 'admin');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='menu_products' and policyname='menu_products_public_select') then
    create policy menu_products_public_select on public.menu_products for select to anon, authenticated using ("status" = 'ACTIVE');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='menu_products' and policyname='menu_products_admin_manage') then
    create policy menu_products_admin_manage on public.menu_products for all to authenticated using (get_current_user_role() = 'admin') with check (get_current_user_role() = 'admin');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='garcons' and policyname='garcons_admin_manage_v2') then
    create policy garcons_admin_manage_v2 on public.garcons for all to authenticated using (get_current_user_role() = 'admin' and "restaurantId" = coalesce(get_current_restaurant_id(), 'default')) with check (get_current_user_role() = 'admin' and "restaurantId" = coalesce(get_current_restaurant_id(), 'default'));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='users' and policyname='users_admin_manage') then
    create policy users_admin_manage on public.users for all to authenticated using (get_current_user_role() = 'admin') with check (get_current_user_role() = 'admin');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='menu_images_authenticated_insert') then
    create policy menu_images_authenticated_insert on storage.objects for insert to authenticated with check (bucket_id = 'menu-images');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='menu_images_authenticated_update') then
    create policy menu_images_authenticated_update on storage.objects for update to authenticated using (bucket_id = 'menu-images') with check (bucket_id = 'menu-images');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='menu_images_authenticated_delete') then
    create policy menu_images_authenticated_delete on storage.objects for delete to authenticated using (bucket_id = 'menu-images');
  end if;
end $$;
