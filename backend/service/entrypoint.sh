#!/usr/bin/env sh
set -e
yes | php artisan migrate
supervisord --config /etc/supervisor/conf.d/supervisord.conf --nodaemon
