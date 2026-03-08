<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

ob_start();

function writeApiLog(string $type, array $context = []): void
{
    $logPath = __DIR__ . '/error.log';
    $timestamp = date('Y-m-d H:i:s');
    $serializedContext = json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $line = "[{$timestamp}] {$type} {$serializedContext}" . PHP_EOL;
    @file_put_contents($logPath, $line, FILE_APPEND | LOCK_EX);
}

register_shutdown_function(static function (): void {
    $error = error_get_last();
    if ($error === null) {
        return;
    }

    $isFatal = in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true);
    if (!$isFatal) {
        return;
    }

    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
    }

    ob_clean();
    writeApiLog('FATAL', [
        'message' => $error['message'] ?? 'UNKNOWN_FATAL_ERROR',
        'file' => $error['file'] ?? null,
        'line' => $error['line'] ?? null,
    ]);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Error fatal en el servidor.',
        'error' => $error['message'] ?? 'UNKNOWN_FATAL_ERROR',
    ], JSON_UNESCAPED_UNICODE);
});

set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Método no permitido.',
        'error' => 'METHOD_NOT_ALLOWED',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$autoloaderPath = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloaderPath)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Falta instalar PHPMailer en el servidor.',
        'error' => 'MISSING_DEPENDENCY',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

require $autoloaderPath;

$rawBody = file_get_contents('php://input');
$payload = json_decode($rawBody, true);

if (!is_array($payload)) {
    writeApiLog('INVALID_PAYLOAD', [
        'raw' => $rawBody,
    ]);
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Payload inválido.',
        'error' => 'INVALID_PAYLOAD',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$name = trim((string)($payload['name'] ?? ''));
$email = trim((string)($payload['email'] ?? ''));
$phone = trim((string)($payload['phone'] ?? ''));
$departureDate = trim((string)($payload['departureDate'] ?? ''));
$returnDate = trim((string)($payload['returnDate'] ?? ''));
$daysQuantity = trim((string)($payload['daysQuantity'] ?? ''));
$peopleQuantity = trim((string)($payload['peopleQuantity'] ?? ''));
$serviceInterest = trim((string)($payload['serviceInterest'] ?? ''));
$inquiry = trim((string)($payload['inquiry'] ?? ''));

$required = [
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'departureDate' => $departureDate,
    'returnDate' => $returnDate,
    'daysQuantity' => $daysQuantity,
    'peopleQuantity' => $peopleQuantity,
    'serviceInterest' => $serviceInterest,
    'inquiry' => $inquiry,
];

foreach ($required as $field => $value) {
    if ($value === '') {
        writeApiLog('VALIDATION_ERROR', [
            'field' => $field,
        ]);
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'data' => ['field' => $field],
            'message' => 'Todos los campos son obligatorios.',
            'error' => 'VALIDATION_ERROR',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    writeApiLog('VALIDATION_ERROR', [
        'field' => 'email',
        'email' => $email,
    ]);
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'data' => ['field' => 'email'],
        'message' => 'El correo electrónico no es válido.',
        'error' => 'VALIDATION_ERROR',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!ctype_digit($daysQuantity) || (int)$daysQuantity <= 0 || !ctype_digit($peopleQuantity) || (int)$peopleQuantity <= 0) {
    writeApiLog('VALIDATION_ERROR', [
        'field' => 'daysQuantity_or_peopleQuantity',
        'daysQuantity' => $daysQuantity,
        'peopleQuantity' => $peopleQuantity,
    ]);
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Cantidad de personas y días deben ser números mayores que 0.',
        'error' => 'VALIDATION_ERROR',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$safeName = str_replace(["\r", "\n"], '', $name);
$safeEmail = str_replace(["\r", "\n"], '', $email);
$safePhone = str_replace(["\r", "\n"], '', $phone);

$subject = 'Nueva solicitud web - Viajes Personalizados';
$htmlBody = '
<h2>Nueva solicitud desde viajerocr.com</h2>
<table cellpadding="8" cellspacing="0" border="1" style="border-collapse: collapse; font-family: Arial, sans-serif;">
  <tr><td><strong>Nombre completo</strong></td><td>' . htmlspecialchars($safeName, ENT_QUOTES, 'UTF-8') . '</td></tr>
  <tr><td><strong>Correo</strong></td><td>' . htmlspecialchars($safeEmail, ENT_QUOTES, 'UTF-8') . '</td></tr>
  <tr><td><strong>Teléfono</strong></td><td>' . htmlspecialchars($safePhone, ENT_QUOTES, 'UTF-8') . '</td></tr>
  <tr><td><strong>Fecha de salida</strong></td><td>' . htmlspecialchars($departureDate, ENT_QUOTES, 'UTF-8') . '</td></tr>
  <tr><td><strong>Fecha de regreso</strong></td><td>' . htmlspecialchars($returnDate, ENT_QUOTES, 'UTF-8') . '</td></tr>
  <tr><td><strong>Cantidad de personas</strong></td><td>' . htmlspecialchars($peopleQuantity, ENT_QUOTES, 'UTF-8') . '</td></tr>
  <tr><td><strong>Cantidad de días</strong></td><td>' . htmlspecialchars($daysQuantity, ENT_QUOTES, 'UTF-8') . '</td></tr>
  <tr><td><strong>Servicio de interés</strong></td><td>' . htmlspecialchars($serviceInterest, ENT_QUOTES, 'UTF-8') . '</td></tr>
  <tr><td><strong>Destinos / Detalles</strong></td><td>' . nl2br(htmlspecialchars($inquiry, ENT_QUOTES, 'UTF-8')) . '</td></tr>
</table>
';

$textBody = "Nueva solicitud desde viajerocr.com\n"
    . "Nombre completo: {$safeName}\n"
    . "Correo: {$safeEmail}\n"
    . "Teléfono: {$safePhone}\n"
    . "Fecha de salida: {$departureDate}\n"
    . "Fecha de regreso: {$returnDate}\n"
    . "Cantidad de personas: {$peopleQuantity}\n"
    . "Cantidad de días: {$daysQuantity}\n"
    . "Servicio de interés: {$serviceInterest}\n"
    . "Destinos / Detalles: {$inquiry}\n";

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'info@viajerocr.com';
    $mail->Password = 'dgphqbkoosydnpss';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    $mail->CharSet = 'UTF-8';

    $mail->setFrom('info@viajerocr.com', 'Viajero CR');
    $mail->addAddress('info@viajerocr.com', 'Viajero CR');
    $mail->addReplyTo($safeEmail, $safeName);

    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body = $htmlBody;
    $mail->AltBody = $textBody;
    $mail->send();

    writeApiLog('MAIL_SENT', [
        'email' => $safeEmail,
        'serviceInterest' => $serviceInterest,
    ]);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => null,
        'message' => 'Correo enviado correctamente.',
        'error' => null,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $exception) {
    writeApiLog('MAIL_ERROR', [
        'message' => $exception->getMessage(),
        'email' => $safeEmail ?? null,
        'serviceInterest' => $serviceInterest ?? null,
    ]);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'No se pudo enviar el correo.',
        'error' => $exception->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}

restore_error_handler();
ob_end_flush();
