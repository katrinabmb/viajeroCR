<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;
use PDO;

final class CotizacionesController
{
    private const ESTADOS_GESTION = ['sin_abrir', 'abierto', 'gestionado'];
    private const ESTADOS_COMPRA = ['pendiente', 'compro', 'no_compro'];

    public function createPublic(): void
    {
        $payload = json_decode(file_get_contents('php://input') ?: '', true);

        $nombre = trim((string) ($payload['nombre_completo'] ?? ''));
        $correo = trim((string) ($payload['correo'] ?? ''));
        $telefono = trim((string) ($payload['telefono'] ?? ''));
        $fechasAproximadas = trim((string) ($payload['fechas_aproximadas'] ?? ''));
        $fechasSeleccionadas = $this->normalizeSelectedDates($payload['fechas_seleccionadas'] ?? null);
        $cantidadPersonas = (int) ($payload['cantidad_personas'] ?? 0);
        $cantidadDias = $payload['cantidad_dias'] ?? null;
        $servicioInteres = trim((string) ($payload['servicio_interes'] ?? ''));
        $servicioInteresId = (int) ($payload['id_servicio_interes'] ?? $payload['servicio_interes_id'] ?? 0);
        $destinoDetalles = trim((string) ($payload['destino_detalles'] ?? ''));

        if ($nombre === '' || $correo === '' || $telefono === '' || $fechasAproximadas === '' || $cantidadPersonas < 1 || $destinoDetalles === '') {
            Response::json([
                'success' => false,
                'message' => 'Completa todos los campos obligatorios.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            Response::json([
                'success' => false,
                'message' => 'Correo invalido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $telefonoDigits = preg_replace('/\D+/', '', $telefono);
        if (!is_string($telefonoDigits) || strlen($telefonoDigits) < 8) {
            Response::json([
                'success' => false,
                'message' => 'Telefono invalido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $diasNormalizados = null;
        if ($cantidadDias !== null && $cantidadDias !== '') {
            $diasNormalizados = (int) $cantidadDias;
            if ($diasNormalizados < 1) {
                Response::json([
                    'success' => false,
                    'message' => 'La cantidad de dias debe ser mayor a 0.',
                    'code' => 'VALIDATION_ERROR',
                ], 422);
            }
        }

        $db = Database::connection();
        $hasFechasSeleccionadas = $this->hasColumn($db, 'tbl_cotizacion', 'fechas_seleccionadas');
        $hasServicioInteresId = $this->hasColumn($db, 'tbl_cotizacion', 'id_servicio_interes');
        $resolvedServicio = $this->resolveServicioInteres($db, $servicioInteresId, $servicioInteres);
        if ($resolvedServicio === null) {
            Response::json([
                'success' => false,
                'message' => 'Selecciona un servicio de interes valido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $servicioIdColumn = $hasServicioInteresId ? 'id_servicio_interes,' : '';
        $servicioIdParam = $hasServicioInteresId ? ':id_servicio_interes,' : '';

        $sql = $hasFechasSeleccionadas
            ? 'INSERT INTO tbl_cotizacion (
                nombre_completo,
                correo,
                telefono,
                fechas_aproximadas,
                fechas_seleccionadas,
                cantidad_personas,
                cantidad_dias,
                ' . $servicioIdColumn . '
                servicio_interes,
                destino_detalles,
                estado_gestion,
                estado_compra,
                source
            ) VALUES (
                :nombre_completo,
                :correo,
                :telefono,
                :fechas_aproximadas,
                :fechas_seleccionadas,
                :cantidad_personas,
                :cantidad_dias,
                ' . $servicioIdParam . '
                :servicio_interes,
                :destino_detalles,
                :estado_gestion,
                :estado_compra,
                :source
            )'
            : 'INSERT INTO tbl_cotizacion (
                nombre_completo,
                correo,
                telefono,
                fechas_aproximadas,
                cantidad_personas,
                cantidad_dias,
                ' . $servicioIdColumn . '
                servicio_interes,
                destino_detalles,
                estado_gestion,
                estado_compra,
                source
            ) VALUES (
                :nombre_completo,
                :correo,
                :telefono,
                :fechas_aproximadas,
                :cantidad_personas,
                :cantidad_dias,
                ' . $servicioIdParam . '
                :servicio_interes,
                :destino_detalles,
                :estado_gestion,
                :estado_compra,
                :source
            )';

        $stmt = $db->prepare($sql);

        $params = [
            'nombre_completo' => $nombre,
            'correo' => function_exists('mb_strtolower') ? mb_strtolower($correo) : strtolower($correo),
            'telefono' => $telefonoDigits,
            'fechas_aproximadas' => $fechasAproximadas,
            'cantidad_personas' => $cantidadPersonas,
            'cantidad_dias' => $diasNormalizados,
            'servicio_interes' => $resolvedServicio['nombre'],
            'destino_detalles' => $destinoDetalles,
            'estado_gestion' => 'sin_abrir',
            'estado_compra' => 'pendiente',
            'source' => 'web_form',
        ];
        if ($hasFechasSeleccionadas) {
            $params['fechas_seleccionadas'] = $fechasSeleccionadas;
        }
        if ($hasServicioInteresId) {
            $params['id_servicio_interes'] = $resolvedServicio['id_servicio_interes'];
        }
        $stmt->execute($params);

        Response::json([
            'success' => true,
            'id_cotizacion' => (int) $db->lastInsertId(),
        ]);
    }

    public function adminList(): void
    {
        Auth::requireUser();
        $db = Database::connection();

        $estadoGestion = trim((string) ($_GET['estado_gestion'] ?? ''));
        $estadoCompra = trim((string) ($_GET['estado_compra'] ?? ''));
        $search = trim((string) ($_GET['search'] ?? ''));
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = max(1, min(100, (int) ($_GET['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;

        $where = [];
        $params = [];

        if ($estadoGestion !== '' && in_array($estadoGestion, self::ESTADOS_GESTION, true)) {
            $where[] = 'estado_gestion = :estado_gestion';
            $params['estado_gestion'] = $estadoGestion;
        }
        if ($estadoCompra !== '' && in_array($estadoCompra, self::ESTADOS_COMPRA, true)) {
            $where[] = 'estado_compra = :estado_compra';
            $params['estado_compra'] = $estadoCompra;
        }
        if ($search !== '') {
            $where[] = '(nombre_completo LIKE :search OR correo LIKE :search OR telefono LIKE :search OR servicio_interes LIKE :search OR destino_detalles LIKE :search)';
            $params['search'] = '%' . $search . '%';
        }

        $whereSql = count($where) > 0 ? ('WHERE ' . implode(' AND ', $where)) : '';

        $totalStmt = $db->prepare("SELECT COUNT(*) FROM tbl_cotizacion $whereSql");
        $totalStmt->execute($params);
        $total = (int) $totalStmt->fetchColumn();

        $hasFechasSeleccionadas = $this->hasColumn($db, 'tbl_cotizacion', 'fechas_seleccionadas');
        $hasServicioInteresId = $this->hasColumn($db, 'tbl_cotizacion', 'id_servicio_interes');
        $fechasSeleccionadasSelect = $hasFechasSeleccionadas
            ? 'fechas_seleccionadas'
            : "NULL AS fechas_seleccionadas";
        $servicioInteresIdSelect = $hasServicioInteresId
            ? 'id_servicio_interes'
            : "NULL AS id_servicio_interes";

        $sql = "SELECT
                    id_cotizacion,
                    nombre_completo,
                    correo,
                    telefono,
                    $servicioInteresIdSelect,
                    servicio_interes,
                    $fechasSeleccionadasSelect,
                    estado_gestion,
                    estado_compra,
                    presupuesto_viaje,
                    destino_final,
                    created_at,
                    opened_at,
                    updated_at
                FROM tbl_cotizacion
                $whereSql
                ORDER BY created_at DESC, id_cotizacion DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue(':' . $k, $v);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        Response::json([
            'success' => true,
            'items' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => (int) ceil($total / $perPage),
            ],
        ]);
    }

    public function adminDetail(): void
    {
        Auth::requireUser();
        $id = (int) ($_GET['id_cotizacion'] ?? 0);
        if ($id < 1) {
            Response::json([
                'success' => false,
                'message' => 'id_cotizacion es requerido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $db = Database::connection();
        $hasFechasSeleccionadas = $this->hasColumn($db, 'tbl_cotizacion', 'fechas_seleccionadas');
        $stmt = $db->prepare('SELECT * FROM tbl_cotizacion WHERE id_cotizacion = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!is_array($item)) {
            Response::json([
                'success' => false,
                'message' => 'Cotizacion no encontrada.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        if (($item['estado_gestion'] ?? '') === 'sin_abrir') {
            $db->prepare(
                "UPDATE tbl_cotizacion
                 SET estado_gestion = 'abierto',
                     opened_at = IFNULL(opened_at, CURRENT_TIMESTAMP),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id_cotizacion = :id"
            )->execute(['id' => $id]);

            $stmt = $db->prepare('SELECT * FROM tbl_cotizacion WHERE id_cotizacion = :id LIMIT 1');
            $stmt->execute(['id' => $id]);
            $item = $stmt->fetch(PDO::FETCH_ASSOC) ?: $item;
        }

        Response::json([
            'success' => true,
            'item' => $item,
        ]);
    }

    public function adminUpdate(): void
    {
        Auth::requireUser();
        $payload = json_decode(file_get_contents('php://input') ?: '', true);
        $id = (int) ($payload['id_cotizacion'] ?? 0);
        if ($id < 1) {
            Response::json([
                'success' => false,
                'message' => 'id_cotizacion es requerido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $estadoGestion = trim((string) ($payload['estado_gestion'] ?? ''));
        $estadoCompra = trim((string) ($payload['estado_compra'] ?? ''));
        $presupuestoRaw = trim((string) ($payload['presupuesto_viaje'] ?? ''));
        $fechasReales = trim((string) ($payload['fechas_reales'] ?? ''));
        $fechasSeleccionadas = $this->normalizeSelectedDates($payload['fechas_seleccionadas'] ?? null);
        $paqueteComprado = trim((string) ($payload['paquete_comprado'] ?? ''));
        $destinoFinal = trim((string) ($payload['destino_final'] ?? ''));
        $observaciones = trim((string) ($payload['observaciones_internas'] ?? ''));

        if ($estadoGestion !== '' && !in_array($estadoGestion, self::ESTADOS_GESTION, true)) {
            Response::json([
                'success' => false,
                'message' => 'estado_gestion invalido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }
        if ($estadoCompra !== '' && !in_array($estadoCompra, self::ESTADOS_COMPRA, true)) {
            Response::json([
                'success' => false,
                'message' => 'estado_compra invalido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $presupuesto = null;
        if ($presupuestoRaw !== '') {
            if (!is_numeric($presupuestoRaw)) {
                Response::json([
                    'success' => false,
                    'message' => 'presupuesto_viaje debe ser numerico.',
                    'code' => 'VALIDATION_ERROR',
                ], 422);
            }
            $presupuesto = (float) $presupuestoRaw;
            if ($presupuesto < 0) {
                Response::json([
                    'success' => false,
                    'message' => 'presupuesto_viaje no puede ser negativo.',
                    'code' => 'VALIDATION_ERROR',
                ], 422);
            }
        }

        $db = Database::connection();
        $hasFechasSeleccionadas = $this->hasColumn($db, 'tbl_cotizacion', 'fechas_seleccionadas');
        $stmt = $db->prepare('SELECT * FROM tbl_cotizacion WHERE id_cotizacion = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($current)) {
            Response::json([
                'success' => false,
                'message' => 'Cotizacion no encontrada.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        $nextEstadoGestion = $estadoGestion !== '' ? $estadoGestion : (string) ($current['estado_gestion'] ?? 'sin_abrir');
        $nextEstadoCompra = $estadoCompra !== '' ? $estadoCompra : (string) ($current['estado_compra'] ?? 'pendiente');
        $nextNombre = array_key_exists('nombre_completo', $payload) ? trim((string) ($payload['nombre_completo'] ?? '')) : (string) ($current['nombre_completo'] ?? '');
        $nextCorreo = array_key_exists('correo', $payload) ? trim((string) ($payload['correo'] ?? '')) : (string) ($current['correo'] ?? '');
        $nextTelefonoRaw = array_key_exists('telefono', $payload) ? trim((string) ($payload['telefono'] ?? '')) : (string) ($current['telefono'] ?? '');
        $nextFechasAprox = array_key_exists('fechas_aproximadas', $payload) ? trim((string) ($payload['fechas_aproximadas'] ?? '')) : (string) ($current['fechas_aproximadas'] ?? '');
        $nextCantidadPersonas = array_key_exists('cantidad_personas', $payload) ? (int) ($payload['cantidad_personas'] ?? 0) : (int) ($current['cantidad_personas'] ?? 0);
        $nextCantidadDiasRaw = array_key_exists('cantidad_dias', $payload) ? ($payload['cantidad_dias'] ?? null) : ($current['cantidad_dias'] ?? null);
        $nextServicioInteres = array_key_exists('servicio_interes', $payload) ? trim((string) ($payload['servicio_interes'] ?? '')) : (string) ($current['servicio_interes'] ?? '');
        $nextServicioInteresId = array_key_exists('id_servicio_interes', $payload)
            ? (int) ($payload['id_servicio_interes'] ?? 0)
            : (int) ($current['id_servicio_interes'] ?? 0);
        $nextDestinoDetalles = array_key_exists('destino_detalles', $payload) ? trim((string) ($payload['destino_detalles'] ?? '')) : (string) ($current['destino_detalles'] ?? '');

        if ($nextNombre === '' || $nextCorreo === '' || $nextTelefonoRaw === '' || $nextFechasAprox === '' || $nextCantidadPersonas < 1 || $nextDestinoDetalles === '') {
            Response::json([
                'success' => false,
                'message' => 'Completa todos los campos obligatorios de la cotizacion.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        if (!filter_var($nextCorreo, FILTER_VALIDATE_EMAIL)) {
            Response::json([
                'success' => false,
                'message' => 'Correo invalido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $nextTelefono = preg_replace('/\D+/', '', $nextTelefonoRaw);
        if (!is_string($nextTelefono) || strlen($nextTelefono) < 8) {
            Response::json([
                'success' => false,
                'message' => 'Telefono invalido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $nextCantidadDias = null;
        if ($nextCantidadDiasRaw !== null && $nextCantidadDiasRaw !== '') {
            $nextCantidadDias = (int) $nextCantidadDiasRaw;
            if ($nextCantidadDias < 1) {
                Response::json([
                    'success' => false,
                    'message' => 'La cantidad de dias debe ser mayor a 0.',
                    'code' => 'VALIDATION_ERROR',
                ], 422);
            }
        }

        $setFechasSeleccionadas = $hasFechasSeleccionadas ? 'fechas_seleccionadas = :fechas_seleccionadas,' : '';
        $hasServicioInteresId = $this->hasColumn($db, 'tbl_cotizacion', 'id_servicio_interes');
        $setServicioInteresId = $hasServicioInteresId ? 'id_servicio_interes = :id_servicio_interes,' : '';
        $resolvedServicio = $this->resolveServicioInteres($db, $nextServicioInteresId, $nextServicioInteres);
        if ($resolvedServicio === null) {
            Response::json([
                'success' => false,
                'message' => 'Selecciona un servicio de interes valido.',
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $sql = "UPDATE tbl_cotizacion
                SET nombre_completo = :nombre_completo,
                    correo = :correo,
                    telefono = :telefono,
                    fechas_aproximadas = :fechas_aproximadas,
                    cantidad_personas = :cantidad_personas,
                    cantidad_dias = :cantidad_dias,
                    $setServicioInteresId
                    servicio_interes = :servicio_interes,
                    destino_detalles = :destino_detalles,
                    estado_gestion = :estado_gestion,
                    estado_compra = :estado_compra,
                    $setFechasSeleccionadas
                    presupuesto_viaje = :presupuesto_viaje,
                    fechas_reales = :fechas_reales,
                    paquete_comprado = :paquete_comprado,
                    destino_final = :destino_final,
                    observaciones_internas = :observaciones_internas,
                    opened_at = CASE
                        WHEN :estado_gestion = 'abierto' AND opened_at IS NULL THEN CURRENT_TIMESTAMP
                        ELSE opened_at
                    END,
                    gestionado_at = CASE
                        WHEN :estado_gestion = 'gestionado' THEN CURRENT_TIMESTAMP
                        ELSE gestionado_at
                    END,
                    compro_at = CASE
                        WHEN :estado_compra = 'compro' THEN CURRENT_TIMESTAMP
                        ELSE compro_at
                    END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id_cotizacion = :id";

        $update = $db->prepare($sql);
        $params = [
            'nombre_completo' => $nextNombre,
            'correo' => function_exists('mb_strtolower') ? mb_strtolower($nextCorreo) : strtolower($nextCorreo),
            'telefono' => $nextTelefono,
            'fechas_aproximadas' => $nextFechasAprox,
            'cantidad_personas' => $nextCantidadPersonas,
            'cantidad_dias' => $nextCantidadDias,
            'servicio_interes' => $resolvedServicio['nombre'],
            'destino_detalles' => $nextDestinoDetalles,
            'estado_gestion' => $nextEstadoGestion,
            'estado_compra' => $nextEstadoCompra,
            'presupuesto_viaje' => $presupuesto,
            'fechas_reales' => $fechasReales !== '' ? $fechasReales : null,
            'paquete_comprado' => $paqueteComprado !== '' ? $paqueteComprado : null,
            'destino_final' => $destinoFinal !== '' ? $destinoFinal : null,
            'observaciones_internas' => $observaciones !== '' ? $observaciones : null,
            'id' => $id,
        ];
        if ($hasFechasSeleccionadas) {
            $params['fechas_seleccionadas'] = $fechasSeleccionadas;
        }
        if ($hasServicioInteresId) {
            $params['id_servicio_interes'] = $resolvedServicio['id_servicio_interes'];
        }
        $update->execute($params);

        Response::json(['success' => true]);
    }

    private function normalizeSelectedDates($value): ?string
    {
        if ($value === null) {
            return null;
        }

        $dates = [];
        if (is_array($value)) {
            $dates = $value;
        } elseif (is_string($value)) {
            $raw = trim($value);
            if ($raw !== '') {
                $dates = explode(',', $raw);
            }
        }

        $valid = [];
        foreach ($dates as $date) {
            $d = trim((string) $date);
            if ($d === '') {
                continue;
            }
            $obj = \DateTime::createFromFormat('Y-m-d', $d);
            if ($obj instanceof \DateTime && $obj->format('Y-m-d') === $d) {
                $valid[$d] = true;
            }
        }

        if (count($valid) === 0) {
            return null;
        }

        $result = array_keys($valid);
        sort($result);
        return implode(',', $result);
    }

    private function hasColumn(PDO $db, string $table, string $column): bool
    {
        $safeTable = str_replace('`', '``', $table);
        $safeColumn = str_replace(['\\', "'"], ['\\\\', "\\'"], $column);
        $sql = "SHOW COLUMNS FROM `{$safeTable}` LIKE '{$safeColumn}'";
        $stmt = $db->query($sql);
        return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
    }

    private function resolveServicioInteres(PDO $db, int $id, string $nombre): ?array
    {
        if ($id > 0) {
            $stmt = $db->prepare(
                'SELECT id_servicio_interes, nombre
                 FROM tbl_servicio_interes
                 WHERE id_servicio_interes = :id
                 LIMIT 1'
            );
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (is_array($row)) {
                return [
                    'id_servicio_interes' => (int) $row['id_servicio_interes'],
                    'nombre' => (string) $row['nombre'],
                ];
            }
        }

        $cleanName = trim($nombre);
        if ($cleanName === '') {
            return null;
        }

        $stmt = $db->prepare(
            'SELECT id_servicio_interes, nombre
             FROM tbl_servicio_interes
             WHERE LOWER(nombre) = LOWER(:nombre)
             LIMIT 1'
        );
        $stmt->execute(['nombre' => $cleanName]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            return null;
        }

        return [
            'id_servicio_interes' => (int) $row['id_servicio_interes'],
            'nombre' => (string) $row['nombre'],
        ];
    }
}
