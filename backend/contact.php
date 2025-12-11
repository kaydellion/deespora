<?php
// contact.php - accepts POST contact form, saves to DB and emails admin with a templated message
header('Content-Type: application/json');
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    // Collect and sanitize inputs
    $name = trim($_POST['name'] ?? '');
    $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $subject = trim($_POST['subject'] ?? '');
    $business = trim($_POST['business'] ?? '');
    $message = trim($_POST['message'] ?? '');

    if (!$name || !$email || !$message) {
        throw new Exception('Name, email and message are required');
    }

    $cfg = require __DIR__ . '/config.php';

    // Save to DB
    $dbCfg = $cfg['db'];
    $dsn = "mysql:host={$dbCfg['host']};port={$dbCfg['port']};dbname={$dbCfg['name']};charset={$dbCfg['charset']}";
    $pdo = new PDO($dsn, $dbCfg['user'], $dbCfg['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    $stmt = $pdo->prepare('INSERT INTO contacts (name, email, subject, business, message, created_at) VALUES (:name, :email, :subject, :business, :message, NOW())');
    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':subject' => $subject,
        ':business' => $business,
        ':message' => $message
    ]);

    // Send email to admin using native PHP mail()
    try {
        $mailCfg = $cfg['mail'];
        $to = 'hello@deespora.com';
        $emailSubject = 'Contact form submission: ' . ($subject ?: 'No subject');
        
        // Load and populate email template
        $template = file_get_contents(__DIR__ . '/templates/contact_email.html');
        
        // Conditionally add business and subject rows
        $businessRow = $business ? '<tr><td style="padding: 12px 0; color: #666; font-size: 14px;"><strong>Business:</strong></td><td style="padding: 12px 0; color: #333; font-size: 14px;">' . htmlspecialchars($business) . '</td></tr>' : '';
        $subjectRow = $subject ? '<tr style="background-color: #ffffff;"><td style="padding: 12px 0; color: #666; font-size: 14px;"><strong>Subject:</strong></td><td style="padding: 12px 0; color: #333; font-size: 14px;">' . htmlspecialchars($subject) . '</td></tr>' : '';
        
        $body = str_replace(
            ['{{NAME}}', '{{EMAIL}}', '{{BUSINESS_ROW}}', '{{SUBJECT_ROW}}', '{{MESSAGE}}', '{{TIMESTAMP}}', '{{SUBJECT_TEXT}}'],
            [
                htmlspecialchars($name),
                htmlspecialchars($email),
                $businessRow,
                $subjectRow,
                nl2br(htmlspecialchars($message)),
                date('F j, Y g:i A'),
                htmlspecialchars($subject ?: 'Your message')
            ],
            $template
        );
        
        // Set headers for HTML email
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: {$mailCfg['from_name']} <{$mailCfg['from_email']}>\r\n";
        $headers .= "Reply-To: {$email}\r\n";
        
        mail($to, $emailSubject, $body, $headers);
    } catch (Exception $e) {
        // Log but continue
    }

    echo json_encode(['success' => true, 'message' => 'Message sent']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
