-- Start a new table/order cycle after the current receipt has been viewed.
-- This preserves all historical sessions/selections and prevents a closed cycle
-- from receiving items from a later order, even when the same table/QR is reused.

CREATE OR REPLACE FUNCTION public.close_table_session_after_view()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW."viewedAt" IS NOT NULL AND OLD."viewedAt" IS NULL THEN
    NEW.status := 'closed';
    NEW."closedAt" := COALESCE(NEW."closedAt", now());
    NEW."attendingWaiterId" := NULL;
    NEW."attendingSince" := NULL;
    NEW."updatedAt" := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS table_sessions_close_after_view ON public.table_sessions;
CREATE TRIGGER table_sessions_close_after_view
BEFORE UPDATE OF "viewedAt" ON public.table_sessions
FOR EACH ROW
EXECUTE FUNCTION public.close_table_session_after_view();

-- Safety net for sessions created before this migration, where all existing
-- selections may already be viewed while the session was left open.
CREATE OR REPLACE FUNCTION public.start_new_table_cycle_after_closed_selections()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_session public.table_sessions%ROWTYPE;
  has_selections boolean;
  has_open_selection boolean;
  next_session_id integer;
BEGIN
  SELECT * INTO current_session
  FROM public.table_sessions
  WHERE id = NEW."sessionId"
  FOR UPDATE;

  IF current_session.status = 'open' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.table_selections
      WHERE "sessionId" = current_session.id
    ) INTO has_selections;

    SELECT EXISTS (
      SELECT 1 FROM public.table_selections
      WHERE "sessionId" = current_session.id
        AND "viewedAt" IS NULL
    ) INTO has_open_selection;

    IF has_selections AND NOT has_open_selection THEN
      UPDATE public.table_sessions
      SET status = 'closed',
          "closedAt" = COALESCE("closedAt", now()),
          "attendingWaiterId" = NULL,
          "attendingSince" = NULL,
          "updatedAt" = now()
      WHERE id = current_session.id;

      INSERT INTO public.table_sessions (
        "sessionToken", "tableNumber", status, "createdAt", "updatedAt", "lastActivityAt"
      ) VALUES (
        gen_random_uuid()::text || gen_random_uuid()::text,
        current_session."tableNumber",
        'open', now(), now(), now()
      )
      RETURNING id INTO next_session_id;

      NEW."sessionId" := next_session_id;
      NEW."selectionNumber" := 1;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS table_selections_new_cycle_after_viewed ON public.table_selections;
CREATE TRIGGER table_selections_new_cycle_after_viewed
BEFORE INSERT ON public.table_selections
FOR EACH ROW
EXECUTE FUNCTION public.start_new_table_cycle_after_closed_selections();
