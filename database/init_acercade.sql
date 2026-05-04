-- Run this inside your DB:
-- local: viajero_cr
-- production: u768363471_viajerocr

CREATE TABLE IF NOT EXISTS tbl_acercade_config (
    id_config TINYINT UNSIGNED NOT NULL,
    title VARCHAR(180) NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    paragraph_1 TEXT NOT NULL,
    paragraph_2 TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_config)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tbl_acercade_config (id_config, title, image_path, paragraph_1, paragraph_2)
VALUES (
    1,
    'Acerca de VIAJERO CR',
    '/imagenes/acercade/viajerocr2.jpeg',
    'ViajeroCR nace de una pasion autentica por descubrir el mundo y de la experiencia personal de Edgar Leiva, quien durante mas de 15 anos ha recorrido mas de 80 paises y una gran diversidad de ciudades y pueblos. Cada destino ha sido una fuente de aprendizaje y cada viaje una experiencia que hoy se transforma en asesoria cercana, honesta y estrategica para quienes confian en este proyecto.',
    'En ViajeroCR cada viaje se disena como si fuera propio. Mas alla de reservar vuelos, trenes y hoteles, el enfoque esta en comprender lo que cada viajero suena vivir y convertirlo en una experiencia bien planificada, segura y memorable. Con conocimiento directo de los destinos, atencion personalizada y cuidado en cada detalle, el objetivo es que cada cliente viaje con confianza, ilusion y respaldo en todo momento, porque viajar no es solo trasladarse: es cumplir suenos con proposito.'
)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    image_path = VALUES(image_path),
    paragraph_1 = VALUES(paragraph_1),
    paragraph_2 = VALUES(paragraph_2);

