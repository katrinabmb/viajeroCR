-- Apply this if tbl_afiliados_logo already exists (production/local).
-- It enforces unique sort_order across affiliate logos.

ALTER TABLE tbl_afiliados_logo
    ADD UNIQUE KEY uq_tbl_afiliados_logo_sort (sort_order);

