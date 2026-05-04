ALTER TABLE tbl_cotizacion
    ADD COLUMN id_servicio_interes BIGINT UNSIGNED NULL AFTER cantidad_dias;

ALTER TABLE tbl_cotizacion
    ADD KEY idx_tbl_cotizacion_servicio_interes (id_servicio_interes);

ALTER TABLE tbl_cotizacion
    ADD CONSTRAINT fk_tbl_cotizacion_servicio_interes
        FOREIGN KEY (id_servicio_interes)
        REFERENCES tbl_servicio_interes (id_servicio_interes)
        ON UPDATE CASCADE
        ON DELETE SET NULL;
