#!/bin/sh

while :
do
    node "../index.js" "ws://127.0.0.1:3333/test" TestUser TestPwd > /dev/null
    if [ $? -eq 3 ]; then
        break
    fi
done
