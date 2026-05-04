USE viajero_cr;

ALTER TABLE tbl_usuario_refresh_token
    ADD COLUMN IF NOT EXISTS last_used_at DATETIME NULL AFTER revoked_at;
