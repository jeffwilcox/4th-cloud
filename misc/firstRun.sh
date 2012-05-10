#!/bin/bash
if [ -f /home/ec2-user/is_push ]; then
cp /home/ec2-user/4th-cloud/misc/4th-push.conf /etc/init/
fi
if [ -f /home/ec2-user/is_web ]; then
cp /home/ec2-user/4th-cloud/misc/4th-web.conf /etc/init/
fi
/usr/local/bin/node /home/ec2-user/4th-cloud/misc/firstRun.js
