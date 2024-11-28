#### Upgrading nextcloud

Before upgrading read the [guide](https://docs.nextcloud.com/server/latest/admin_manual/maintenance/upgrade.html). Make sure no database version upgrade is required, and if so, it is required to perform the MariaDB upgrade procedures with backup.

Moreover, update the `nginx` ConfigMap to the newest [`nginx.conf`](https://github.com/nextcloud/docker/blob/master/.examples/docker-compose/insecure/mariadb/fpm/web/nginx.conf).

Change the following sections in [`nginx.conf`](https://github.com/nextcloud/docker/blob/master/.examples/docker-compose/insecure/mariadb/fpm/web/nginx.conf) to customize to the cluster (without the description comments starting with `##`):

```
## Change app:9000 to nextcloud-fpm:9000

upstream php-handler {
    server nextcloud-fpm:9000;
}

## Change and add the below values

# set max upload size and increase upload timeout:
proxy_max_temp_file_size 0;
proxy_buffering off;
proxy_request_buffering off;
fastcgi_read_timeout 86400s;
client_max_body_size 0;
client_body_timeout 86400s;
fastcgi_buffers 64 4K;
```

The image for the nextcloud is set to the major version. To upgrade, change the image to the next major, and wait for the pod to be restarted pod to complete the upgrade.

After the upgrade, you need to run the [long running steps](https://docs.nextcloud.com/server/latest/admin_manual/maintenance/upgrade.html#long-running-migration-steps) manually.

NOTE: In order to run `occ`: use `su -s /bin/sh -c 'php occ [command]' www-data` or `sudo -E -u www-data php occ [command]` inside the `nextcloud-fpm` pod's `nextcloud` container.

Collabora and LanguageTool should only require a restart to become upgraded.
