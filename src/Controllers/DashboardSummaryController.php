<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;
use PDO;
use Throwable;

final class DashboardSummaryController
{
    public function adminSummary(): void
    {
        Auth::requireUser();
        $db = Database::connection();

        $modules = [
            'seccion1_slider' => $this->moduleCounts($db, 'tbl_seccion1_slider', 'id_slide'),
            'afiliados' => $this->moduleCounts($db, 'tbl_afiliados_logo', 'id_logo'),
            'seccion2_partners' => $this->moduleCounts($db, 'tbl_seccion2_partner_logo', 'id_logo'),
            'seccion3_continentes' => $this->moduleCounts($db, 'tbl_seccion3_continent', 'id_continent'),
            'seccion3_destinos' => $this->moduleCounts($db, 'tbl_seccion3_destination', 'id_destination'),
            'seccion4_servicios' => $this->moduleCounts($db, 'tbl_seccion4_servicio', 'id_servicio'),
            'seccion5_salidas' => $this->moduleCounts($db, 'tbl_seccion5_salida', 'id_salida'),
            'testimonios' => $this->moduleCounts($db, 'tbl_testimonios_item', 'id_testimonio'),
        ];

        $summary = [
            'total_items' => $this->sumField($modules, 'total'),
            'active_items' => $this->sumField($modules, 'active'),
            'inactive_items' => $this->sumField($modules, 'inactive'),
            'configured_sections' => $this->countConfiguredSections($db),
            'last_content_update' => $this->lastContentUpdate($db),
            'db_connection' => Database::connectionName() ?? 'unknown',
        ];

        Response::json([
            'success' => true,
            'summary' => $summary,
            'modules' => $modules,
        ]);
    }

    private function moduleCounts(PDO $db, string $table, string $idColumn): array
    {
        try {
            $stmt = $db->query(
                "SELECT 
                    COUNT($idColumn) AS total,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active,
                    SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive
                 FROM $table"
            );
            $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

            return [
                'total' => (int) ($row['total'] ?? 0),
                'active' => (int) ($row['active'] ?? 0),
                'inactive' => (int) ($row['inactive'] ?? 0),
            ];
        } catch (Throwable) {
            return [
                'total' => 0,
                'active' => 0,
                'inactive' => 0,
            ];
        }
    }

    private function sumField(array $modules, string $field): int
    {
        $total = 0;
        foreach ($modules as $module) {
            $total += (int) ($module[$field] ?? 0);
        }
        return $total;
    }

    private function countConfiguredSections(PDO $db): int
    {
        $checks = [
            "SELECT COUNT(*) FROM tbl_seccion1_slider",
            "SELECT COUNT(*) FROM tbl_afiliados_logo",
            "SELECT COUNT(*) FROM tbl_seccion2_partner_logo",
            "SELECT COUNT(*) FROM tbl_seccion3_continent",
            "SELECT COUNT(*) FROM tbl_seccion4_servicio",
            "SELECT COUNT(*) FROM tbl_seccion5_salida",
            "SELECT COUNT(*) FROM tbl_testimonios_item",
            "SELECT COUNT(*) FROM tbl_footer_config",
            "SELECT COUNT(*) FROM tbl_whatsapp_config",
        ];

        $configured = 0;
        foreach ($checks as $sql) {
            try {
                $count = (int) $db->query($sql)->fetchColumn();
                if ($count > 0) {
                    $configured++;
                }
            } catch (Throwable) {
                // Ignore missing table in mixed environments.
            }
        }
        return $configured;
    }

    private function lastContentUpdate(PDO $db): ?string
    {
        $tables = [
            ['tbl_seccion1_slider', 'updated_at'],
            ['tbl_afiliados_logo', 'updated_at'],
            ['tbl_seccion2_partner_logo', 'updated_at'],
            ['tbl_seccion3_continent', 'updated_at'],
            ['tbl_seccion3_destination', 'updated_at'],
            ['tbl_seccion4_servicio', 'updated_at'],
            ['tbl_seccion5_salida', 'updated_at'],
            ['tbl_testimonios_item', 'updated_at'],
            ['tbl_footer_config', 'updated_at'],
            ['tbl_whatsapp_config', 'updated_at'],
        ];

        $latest = null;
        foreach ($tables as [$table, $column]) {
            try {
                $value = $db->query("SELECT MAX($column) FROM $table")->fetchColumn();
                if (!is_string($value) || $value === '') {
                    continue;
                }
                if ($latest === null || strcmp($value, $latest) > 0) {
                    $latest = $value;
                }
            } catch (Throwable) {
                // Ignore missing table in mixed environments.
            }
        }

        return $latest;
    }
}

