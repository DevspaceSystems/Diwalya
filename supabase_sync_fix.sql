-- IMPROVED SYNC TRIGGER
-- This version uses explicit casts and handles metadata carefully

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role "Role";
BEGIN
    -- Determine role from metadata or default to CLIENT
    BEGIN
        user_role := (new.raw_user_meta_data->>'role')::"Role";
    EXCEPTION WHEN OTHERS THEN
        user_role := 'CLIENT'::"Role";
    END;

    INSERT INTO public."User" (
        id, 
        email, 
        name, 
        role, 
        "updatedAt",
        "createdAt"
    )
    VALUES (
        new.id::text,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
        user_role,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        "updatedAt" = now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
