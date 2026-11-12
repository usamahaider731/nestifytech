<?php

namespace App\Services;

use Stripe\HttpClient\ClientInterface;
use Stripe\Util\CaseInsensitiveArray;
use Stripe\Util\Util;
use Stripe\Exception\ApiConnectionException;
use Stripe\Exception\UnexpectedValueException;

class StripeFallbackClient implements ClientInterface
{
    protected static $instance;

    public static function instance(): self
    {
        if (!static::$instance) {
            static::$instance = new static();
        }
        return static::$instance;
    }

    public function getUserAgentInfo(): array
    {
        return [
            'httplib' => 'php-stream',
            'ssllib'  => 'openssl',
        ];
    }

    /**
     * @param 'delete'|'get'|'post' $method
     * @param string $absUrl
     * @param array $headers
     * @param array $params
     * @param bool $hasFile
     * @param 'v1'|'v2' $apiMode
     * @param null|int $maxNetworkRetries
     *
     * @return array [$rawBody, $httpStatusCode, $headers]
     */
    public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1', $maxNetworkRetries = null)
    {
        $method = strtoupper($method);
        $serializeNull = ('POST' === $method && 'v2' === $apiMode);
        $params = Util::objectsToIds($params, $serializeNull);

        $body = null;
        if ('POST' === $method) {
            $absUrl = Util::utf8($absUrl);
            if ($hasFile) {
                throw new UnexpectedValueException("File uploads are not supported by the fallback stream client.");
            }
            if ('v2' === $apiMode) {
                $body = empty($params) ? null : json_encode($params);
            } else {
                $body = Util::encodeParameters($params);
            }
        } elseif ('GET' === $method || 'DELETE' === $method) {
            if ($hasFile) {
                throw new UnexpectedValueException("Unexpected: {$method} methods don't support file attachments.");
            }
            if (!empty($params)) {
                $encoded = Util::encodeParameters($params, $apiMode);
                $absUrl = "{$absUrl}?{$encoded}";
            }
            $absUrl = Util::utf8($absUrl);
        }

        $headerLines = [];
        $hasContentType = false;
        foreach ($headers as $h) {
            $headerLines[] = $h;
            if (stripos($h, 'Content-Type:') === 0) {
                $hasContentType = true;
            }
        }

        if ('POST' === $method && !$hasContentType && !empty($body)) {
            $headerLines[] = 'Content-Type: application/x-www-form-urlencoded';
        }

        $streamOpts = [
            'http' => [
                'method'        => $method,
                'header'        => implode("\r\n", $headerLines) . "\r\n",
                'content'       => $body,
                'ignore_errors' => true,
                'timeout'       => 60,
            ],
            'ssl' => [
                'verify_peer'      => true,
                'verify_peer_name' => true,
            ],
        ];

        $context = stream_context_create($streamOpts);
        $responseBody = @file_get_contents($absUrl, false, $context);

        if ($responseBody === false) {
            $lastError = error_get_last();
            $msg = $lastError['message'] ?? "Could not connect to Stripe via HTTP stream ({$absUrl}).";
            throw new ApiConnectionException("Stripe API connection failed: {$msg}");
        }

        $statusCode = 200;
        $rheaders = new CaseInsensitiveArray();

        // PHP 8.4+ provides http_get_last_response_headers(), fallback to $http_response_header
        $rawResponseHeaders = function_exists('http_get_last_response_headers')
            ? http_get_last_response_headers()
            : ($http_response_header ?? []);

        if (is_array($rawResponseHeaders)) {
            foreach ($rawResponseHeaders as $line) {
                if (preg_match('#^HTTP/\S+\s+(\d+)#i', $line, $matches)) {
                    $statusCode = (int) $matches[1];
                } else {
                    $parts = explode(':', $line, 2);
                    if (count($parts) === 2) {
                        $rheaders[trim($parts[0])] = trim($parts[1]);
                    }
                }
            }
        }

        return [$responseBody, $statusCode, $rheaders];
    }
}

