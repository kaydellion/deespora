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
    
    // ✅ Avoid multiple connections
    if (!isset($con) || !$con instanceof mysqli || !$con->ping()) {
        $con = mysqli_connect($dbCfg['host'], $dbCfg['user'], $dbCfg['pass'], $dbCfg['name']);

        if (!$con) {
            error_log("❌ DB Connection failed: " . mysqli_connect_error());
            throw new Exception("Database connection error. Please try again later.");
        }

        mysqli_set_charset($con, "utf8mb4");
        mysqli_query($con, "SET time_zone = '+01:00'"); // Africa/Lagos
    }

    $stmt = mysqli_prepare($con, 'INSERT INTO subscribers (email, created_at) VALUES (?, NOW())');
    mysqli_stmt_bind_param($stmt, 's', $email);
    
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception("Failed to save subscriber: " . mysqli_error($con));
    }
    
    mysqli_stmt_close($stmt);

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
