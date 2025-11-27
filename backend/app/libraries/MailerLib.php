<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

/**
 * Library: MailerLib
 * 
 * Automatically generated via CLI.
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class MailerLib
{

    public function __construct()
    {
        // Library initialized
    }

    public function sendMail($email, $subject, $body)
    {
        //Create an instance; passing `true` enables exceptions
        $mail = new PHPMailer(true);

        try {
            //Server settings
            $mail->isSMTP();                                                    //Send using SMTP
            $mail->Host = 'smtp.gmail.com';                                     //Set the SMTP server to send through
            $mail->SMTPAuth = true;                                             //Enable SMTP authentication
            $mail->Username = 'melomelodeon@gmail.com';                         //SMTP username
            $mail->Password = 'bobj xvlh gtur wnsd';                            //SMTP password
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;                    //Enable implicit TLS encryption
            $mail->Port = 465;                                                  //TCP port to connect to; use 587 if you have set `SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS`
            $mail->setFrom('melomelodeon@gmail.com', 'Mailer');

            //Recipient
            $mail->addAddress($email);

            //Content
            $mail->isHTML(true);                                        //Set email format to HTML
            $mail->Subject = $subject;
            $mail->Body = $body;
            $mail->AltBody = strip_tags($body);

            $mail->send();
        } catch (Exception $e) {
            echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
        }
    }
}
