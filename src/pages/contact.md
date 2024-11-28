---
title: 'Contacts'
layout: '~/layouts/MarkdownLayout.astro'
---

# [matrix]

We're using the new innovative federated communication system [https://matrix.org](https://matrix.org). You can get an account using any compatible client.


<div class="p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400" role="alert">
  <span class="font-medium">❗</span> Don't try contacting admins in matrix by private messages, those will be rejected. Use public rooms for general support questions.
</div>

## Registration
#### Joining via web page

1. Navigate to [our web version of Element client](https://element.nrp-nautilus.io) if you want to use the Nautilus homeserver with full support by the Nautilus team. A lot of users also use the default [Matrix.org homeserver](https://app.element.io/) or other custom homeservers, but we might not be able to help with issues that may arise. Nonetheless, other homeservers also work, so if you think you will use Matrix outside Nautilus frequently, you may create an account and login using the [Matrix.org homeserver](https://app.element.io/).

2. Choose _Create Account_, then create an account by entering a desired username, password and email.

3. After that you'll get an account of the form `@username:matrix.nrp-nautilus.io`, which you can use to join rooms in any federated [matrix] resource, including the original [https://matrix.org](https://matrix.org).

4. Click explore rooms button. Check that you're exploring the NRP server (matrix.nrp-nautilus.io). You'll automatically join the Nautilus General channel and the News channel.

**Make sure to backup your encryption key to always have access to your encrypted messages! Go to User Settings -> Security & Privacy and click Start using Key Backup.** There's a pretty detailed [FAQ on using the Matrix Element client](https://element.io/help) including the security. Having email set will let you recover your account password (**but not the encryption keys!**).

Using this Matrix account, you may also join various [IRC Networks](https://matrix-org.github.io/matrix-appservice-irc/latest/bridged_networks), or any [Gitter](https://gitter.im/) community. The IRC bridge is an especially useful functionality of the Matrix protocol. Even when you are offline, the Matrix client will continue to receive your IRC messages and bring up notifications when someone mentions you.

#### Alternative web app

You can also try a similar web app [Cinny](https://app.cinny.in)

#### Joining via mobile apps

1. Get a [phone or desktop version of element](https://element.io/get-started) or [any other compatible client](https://matrix.org/clients/)

2. Change the server to the NRP one:

    * Click the change server button

    ![Matrix](~/assets/images/matrix_server.png)
    
    * The NRP matrix homeserver URL is `https://matrix.nrp-nautilus.io`

3. Follow the [Joining via web page guide](#joining-via-web-page) from step 2

#### Make yourself discoverable

To let us find you by email (in case we need to link your NRP account to your matrix account) please enable the identity server integration. Go to Settings in Element (Your Account -> All Settings) and accept the Discovery:

![Discovery](~/assets/images/discovery.png)

Click `Accept` and then `Continue`.

After that click `Share` for each Email address that you want to be discoverable by. The email will be protected agains harvesting and will only be used to find your account by persons knowing your email already.

## User guide

[Official user guide for using Element](https://element.io/user-guide)

## Possible issues

If you've created the account on matrix.org server (not the NRP one), and have the user ID like `@username:matrix.org`, you should use the standard <https://app.element.io> web page to log in.
