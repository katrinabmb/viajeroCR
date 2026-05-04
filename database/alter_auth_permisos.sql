CREATE TABLE IF NOT EXISTS tbl_permiso (
    id_permiso BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_permiso),
    UNIQUE KEY uq_tbl_permiso_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tbl_permiso (nombre, codigo, is_active) VALUES
    ('Administrador', 'admin', 1),
    ('Editor', 'editor', 1)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    is_active = VALUES(is_active);

SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tbl_usuario'
      AND COLUMN_NAME = 'id_permiso'
);

SET @col_sql := IF(
    @col_exists = 0,
    'ALTER TABLE tbl_usuario ADD COLUMN id_permiso BIGINT UNSIGNED NULL AFTER password_hash',
    'SELECT 1'
);
PREPARE stmt_col FROM @col_sql;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;

SET @idx_exists := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tbl_usuario'
      AND INDEX_NAME = 'idx_tbl_usuario_permiso'
);

SET @idx_sql := IF(
    @idx_exists = 0,
    'ALTER TABLE tbl_usuario ADD INDEX idx_tbl_usuario_permiso (id_permiso)',
    'SELECT 1'
);
PREPARE stmt_idx FROM @idx_sql;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;

UPDATE tbl_usuario u
JOIN tbl_permiso p ON p.codigo = 'admin'
SET u.id_permiso = p.id_permiso
WHERE u.id_permiso IS NULL;

SET @fk_exists := (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'tbl_usuario'
      AND CONSTRAINT_NAME = 'fk_tbl_usuario_permiso'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @fk_sql := IF(
    @fk_exists = 0,
    'ALTER TABLE tbl_usuario ADD CONSTRAINT fk_tbl_usuario_permiso FOREIGN KEY (id_permiso) REFERENCES tbl_permiso (id_permiso) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT 1'
);
PREPARE stmt FROM @fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
