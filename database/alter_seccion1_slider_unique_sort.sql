-- Apply this if tbl_seccion1_slider already exists (production/local).
-- It enforces unique sort_order across slides.

ALTER TABLE tbl_seccion1_slider
    ADD UNIQUE KEY uq_tbl_seccion1_slider_sort (sort_order);

