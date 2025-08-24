---
title: Nextcloud
description: Description
---

#### Upgrading Nextcloud

##### Before Upgrading

Before upgrading, read the [Guide](https://docs.nextcloud.com/server/latest/admin_manual/maintenance/upgrade.html) and [Critical Changes](https://docs.nextcloud.com/server/latest/admin_manual/release_notes/index.html#critical-changes) if upgrading to the next **major release**.

Note that [to upgrade to the next **major release**](https://docs.nextcloud.com/server/latest/admin_manual/maintenance/upgrade.html#approaching-upgrades), first upgrade to the latest minor release of the current major release, then upgrade to the latest minor release of the next major release (do not skip major releases, upgrade by one major release only), than repeat this procedure until the latest minor release of the latest major release.

Make sure no database version upgrade is required, and if so, perform the MariaDB upgrade procedures after backup beforehand.

##### Upgrading NGINX

Moreover, update the `nginx` ConfigMap to the newest [`nginx.conf`](https://github.com/nextcloud/docker/blob/master/.examples/docker-compose/insecure/mariadb/fpm/web/nginx.conf).

Change the following sections in [`nginx.conf`](https://github.com/nextcloud/docker/blob/master/.examples/docker-compose/insecure/mariadb/fpm/web/nginx.conf) to customize to the cluster (without the description comments starting with `##`):

```
## Change app:9000 to 127.0.0.1:9000

resolver 127.0.0.11 valid=2s;
upstream php-handler {
    zone backends 64k;
    server 127.0.0.1:9000 resolve;
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

##### Deployment upgrade

> NOTE: In order to run `occ`: use the `bash` shell started by `su -s /bin/bash www-data` or run `su -s /bin/sh -c 'php occ [command]' www-data` inside the `nextcloud` container of the `nextcloud-fpm` pod.

To upgrade, change all `nextcloud` images to the latest revision of the minor version (unless upgrading to the next major version, follow the major release upgrade procedures above), and wait for the pod to be restarted.

Because of database initialization, the startup for Nextcloud may take some time. Read the upgrade logs inside the pod container to conclude, and use `php occ upgrade` if required.

After the upgrade, you need to run the [long running steps](https://docs.nextcloud.com/server/latest/admin_manual/maintenance/upgrade.html#long-running-migration-steps) manually (include `php occ db:convert-mysql-charset`, `php occ db:convert-filecache-bigint`, `php occ db:add-missing-columns`, `php occ db:add-missing-indices`, `php occ db:add-missing-primary-keys`), and finally run `php occ maintenance:repair --include-expensive`.

Collabora and LanguageTool should only require a restart to upgrade.
