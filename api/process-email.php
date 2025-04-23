<?php
// Prevent direct access to this file
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../index.html');
    exit;
}

// Basic anti-bot measures
// 1. Check for a hidden honeypot field - bots often fill all fields
if (isset($_POST['website']) && !empty($_POST['website'])) {
    // This is likely a bot - the honeypot field should be empty
    // Silently redirect as if successful to not alert the bot
    header('Location: ../index.html?status=success#newsletter');
    exit;
}

// 2. Check for request timing - too fast is suspicious
$minFormTime = 2; // seconds
if (isset($_POST['form_time'])) {
    $formTime = time() - (int)$_POST['form_time'];
    if ($formTime < $minFormTime) {
        // Too fast to be human - likely bot
        header('Location: ../index.html?status=success#newsletter');
        exit;
    }
}

// Get the email from the form
$email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    // Invalid email
    header('Location: ../index.html?status=invalid#newsletter');
    exit;
}

// Check for common disposable email domains (optional)
$disposableDomains = ['mailinator.com', 'tempmail.com', 'fakeinbox.com', 'guerrillamail.com'];
$emailDomain = substr(strrchr($email, "@"), 1);
$isDisposable = in_array(strtolower($emailDomain), $disposableDomains);

// Prepare file paths - store data in a secure location
// Use a directory that's NOT web-accessible
$dataDir = '../data';
$logFile = $dataDir . '/newsletter_subscribers.csv';
$lastDigestFile = $dataDir . '/last_newsletter_digest.txt';
$timestamp = date('Y-m-d H:i:s');

// Create the data directory if it doesn't exist
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0750); // More restrictive permissions
    
    // Create an .htaccess file to protect the directory
    $htaccess = "# Deny access to all files in this directory\n";
    $htaccess .= "Order deny,allow\n";
    $htaccess .= "Deny from all\n";
    $htaccess .= "# Disable directory browsing\n";
    $htaccess .= "Options -Indexes\n";
    $htaccess .= "# Disable script execution\n";
    $htaccess .= "<Files \"*.php\">\n";
    $htaccess .= "  Order Deny,Allow\n";
    $htaccess .= "  Deny from all\n";
    $htaccess .= "</Files>\n";
    
    file_put_contents($dataDir . '/.htaccess', $htaccess);
    
    // Add an empty index.html file for extra protection
    file_put_contents($dataDir . '/index.html', '<html><head><title>403 Forbidden</title></head><body><h1>Access Denied</h1></body></html>');
}

// Check for duplicate email
$isDuplicate = false;
if (file_exists($logFile)) {
    $subscribers = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($subscribers as $line) {
        $parts = explode(',', $line);
        if (isset($parts[1]) && trim($parts[1]) === $email) {
            $isDuplicate = true;
            break;
        }
    }
}

// If duplicate, redirect with special status
if ($isDuplicate) {
    header('Location: ../index.html?status=duplicate&email=' . urlencode($email) . '#newsletter');
    exit;
}

// Store the email in CSV file with proper permissions
$result = file_put_contents($logFile, "$timestamp,$email\n", FILE_APPEND);
if ($result) {
    // Set proper permissions on the file
    chmod($logFile, 0640); // Owner can read/write, group can read, others nothing
}

// Count total subscribers for digest
$subscriberCount = 0;
if (file_exists($logFile)) {
    $subscriberCount = count(file($logFile));
}

// Prepare email digest logic
$sendDigest = false;

if (!file_exists($lastDigestFile)) {
    // First subscriber or missing file
    file_put_contents($lastDigestFile, $timestamp);
    chmod($lastDigestFile, 0640); // Set secure permissions
    $sendDigest = true;
} else {
    $lastDigestTime = file_get_contents($lastDigestFile);
    $timeSinceLastDigest = time() - strtotime($lastDigestTime);
    
    // Send digest if it's been 24 hours OR we have 5 new subscribers since last digest
    if ($timeSinceLastDigest > 86400 || $subscriberCount % 5 == 0) {
        $sendDigest = true;
        file_put_contents($lastDigestFile, $timestamp);
    }
}

// Configure email parameters
$to = 'michael@retroverse.studio';
$headers = 'From: newsletter@retroverse.studio' . "\r\n" .
           'Reply-To: ' . $email . "\r\n" .
           'X-Mailer: PHP/' . phpversion();

// Decide whether to send individual notification, digest, or both
$emailSuccess = true;

// Send individual notification only if digests are infrequent
if (!$sendDigest) {
    $subject = 'New RetroVerse Studios Newsletter Subscriber';
    $message = "New newsletter subscriber: $email\n\nTimestamp: $timestamp\n\n";
    $message .= "Total subscribers: $subscriberCount\n";
    if ($isDisposable) {
        $message .= "\nNote: This appears to be from a disposable email domain.\n";
    }
    
    // Send email notification
    $emailSuccess = mail($to, $subject, $message, $headers);
}

// Send digest if needed
if ($sendDigest) {
    // Read all subscribers
    $allSubscribers = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $subscriberList = '';
    
    foreach ($allSubscribers as $line) {
        $subscriberList .= $line . "\n";
    }
    
    // Send digest email
    $digestSubject = "RetroVerse Studios Newsletter Subscribers Digest - Total: $subscriberCount";
    $digestMessage = "Here is the current list of RetroVerse Studios newsletter subscribers:\n\n$subscriberList";
    $digestMessage .= "\nLatest subscriber: $email (added on $timestamp)";
    
    // Send digest email
    $emailSuccess = mail($to, $digestSubject, $digestMessage, $headers);
}

// Redirect based on success/failure
if ($emailSuccess) {
    header('Location: ../index.html?status=success&email=' . urlencode($email) . '#newsletter');
} else {
    // Failed to send email, but we still saved the subscriber
    header('Location: ../index.html?status=partial&email=' . urlencode($email) . '#newsletter');
}

/*
// Alternative approach using PHPMailer (requires additional setup)
// Uncomment this section and comment out the section above if you want to use SMTP directly
// You would need to upload PHPMailer files to your server

require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';
require 'PHPMailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

$mail = new PHPMailer(true);

try {
    // Server settings - Using your provided configuration
    $mail->isSMTP();
    $mail->Host       = 'mail.retroverse.studio';  // Your SMTP server
    $mail->SMTPAuth   = true;
    $mail->Username   = 'michael@retroverse.studio';  // Your email
    $mail->Password   = 'YOUR_PASSWORD_HERE';  // Add this manually on the server
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;  // Use SSL
    $mail->Port       = 465;  // SSL port for your server

    // Recipients
    $mail->setFrom('newsletter@retroverse.studio', 'RetroVerse Studios');
    $mail->addAddress('michael@retroverse.studio', 'Michael');
    $mail->addReplyTo($email);

    // Content
    $mail->isHTML(true);
    $mail->Subject = $sendDigest ? $digestSubject : $subject;
    $mail->Body    = $sendDigest ? $digestMessage : $message;
    $mail->AltBody = $sendDigest ? $digestMessage : $message;

    $mail->send();
    header('Location: ../index.html?status=success&email=' . urlencode($email) . '#newsletter');
} catch (Exception $e) {
    error_log("Mailer Error: {$mail->ErrorInfo}");
    header('Location: ../index.html?status=error#newsletter');
}
*/
?>