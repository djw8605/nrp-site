---
title: '[matrix] Chat for Nautilus Users'
date: Mon, 03 Jan 2022 19:47:07 +0000
draft: false
tags: ['Updates']
---

We're using the new innovative federated communication system [https://matrix.org](https://matrix.org) for all communications regarding the project. It's deployed in our cluster, and you can create an account in it using any compatible client.

**Don't try contacting admins by private messages, those will be rejected. 99% of questions can be solved in public rooms.**

#### Joining via web page

1.  Navigate to [our hosted web version of element.io](https://element.nrp-nautilus.io)
2.  Choose _Create Account_, then create an account by entering a desired username, password and (optional) email.
3.  After that you'll get an account of the form `@username:matrix.nrp-nautilus.io`, which you can use to join rooms in any federated \[matrix\] resourse, including the original matrix.org.
4.  Click explore rooms button. Check that you're exploring the NRP server (matrix.nrp-nautilus.io). Join the Nautilus General channel. Also join the News channel.
5.  (Optional) Join the NRP Community by clicking the `+nrp:matrix.nrp-nautilus.io` URL in the header of the General channel. Another link to it is: [https://matrix-to.nrp-nautilus.io/#/+nrp:matrix.nrp-nautilus.io](https://matrix-to.nrp-nautilus.io/#/+nrp:matrix.nrp-nautilus.io). It has a list of channels you can join.

**Make sure to backup your encryption key to always have access to your encrypted messages! Go to User Settings -> Security & Privacy and click Start using Key Backup.** There's a pretty detailed [FAQ on using the Matrix Element client](https://element.io/help) including the security. Having email set will let you recover your account password (**but not the encryption keys!**)

#### Joining via apps

1.  Get a [phone or desktop version of element](https://element.io/get-started) or [any other compatible client](https://matrix.org/clients/)
2.  Change the server to the NRP one:
3.  Click the change server button ![](https://ucsd-prp.gitlab.io/userdocs/images/matrix_server.png)
4.  The NRP matrix homeserver URL is `https://matrix.nrp-nautilus.io`
5.  Follow the Joining via web page guide from step 2

#### Make yourself discoverable

To let us find you by email (in case we need to link your PRP account to your matrix account) please enable the identity server integration. Go to Settings in Element (Your Account -> All Settings) and accept the Discovery:

Click `Accept` and then `Continue`.

After that click `Share` for each Email address that you want to be discoverable by. The email will be protected against harvesting and will only be used to find your account by persons knowing your email already.

#### Possible issues

If you've created the account on matrix.org server (not the NRP one), and have the user ID like `@username:matrix.org`, you can use the standard [https://app.element.io](https://app.element.io) web page to log in.