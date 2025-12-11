<?php
// subscribe.php - accepts POST {email} and stores into subscribers table then emails admin
header('Content-Type: application/json');
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    $data = $_POST;
    $email = filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL);
    if (!$email) throw new Exception('Invalid email');

    $cfg = require __DIR__ . '/config.php';

    // Save to DB
    $dbCfg = $cfg['db'];
    $dsn = "mysql:host={$dbCfg['host']};port={$dbCfg['port']};dbname={$dbCfg['name']};charset={$dbCfg['charset']}";
    $pdo = new PDO($dsn, $dbCfg['user'], $dbCfg['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    $stmt = $pdo->prepare('INSERT INTO subscribers (email, created_at) VALUES (:email, NOW())');
    $stmt->execute([':email' => $email]);

    // Send email to admin using native PHP mail()
    try {
        $mailCfg = $cfg['mail'];
        $to = 'hello@deespora.com';
        $subject = 'New subscriber - ' . $email;
        
        // Load and populate email template
        $template = file_get_contents(__DIR__ . '/templates/subscribe_email.html');
        $body = str_replace(
            ['{{EMAIL}}', '{{TIMESTAMP}}'],
            [htmlspecialchars($email), date('F j, Y g:i A')],
            $template
        );
        
        // Set headers for HTML email
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: {$mailCfg['from_name']} <{$mailCfg['from_email']}>\r\n";
        $headers .= "Reply-To: {$mailCfg['from_email']}\r\n";
        
        mail($to, $subject, $body, $headers);
    } catch (Exception $e) {
        // continue even if email failed
    }

    echo json_encode(['success' => true, 'message' => 'Subscribed']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
